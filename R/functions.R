library(actuar)
library(tidyverse)

insurance_conditions <- function(losses, limit, deductible) {
  pmin(limit, pmax(0, losses - deductible))
}

rating_model <- function(nel, tvar) {
  nel + .08 * (tvar - nel)
}

tvar <- function(losses, q) {
  mean(losses[losses >= quantile(losses, q)])
}

simulate_annual_losses <- function(
  event_limit,
  event_deductible,
  aal,
  aad,
  n_years = 1e5
) {
  pls <- tibble(
    year = 1:n_years,
    nlosses = rpois(n_years, 1),
    fgu_losses = map(nlosses, ~rpareto1(.x, 1.2, 2e6))
  )

  pls <- pls |>
    mutate(
      net_losses = map(fgu_losses, ~insurance_conditions(.x, event_limit, event_deductible)),
      total_gross_net_loss = map_dbl(net_losses, sum),
      total_net_loss = insurance_conditions(total_gross_net_loss, aal, aad)
    ) 

  pls
}

aggregate_annual_losses <- function(pls) {
  pls |>
    summarize(
      mean_net_loss = mean(total_net_loss),
      var = quantile(total_net_loss, .99),
      tvar = tvar(total_net_loss, .99),
      premium = rating_model(mean_net_loss, tvar)
    )
}

simulate_xl <- function(event_limit, event_deductible, aal, aad, n_years = 1e4, ...) {
  pls <- simulate_annual_losses(event_limit, event_deductible, aal, aad, n_years)
  aggregate_annual_losses(pls)
}

dev_pattern <- function(event_limit, event_deductible, aal, aad, n_years = 1e4, ...) {
  pls <- tibble(
    year = 1:n_years,
    nlosses = rpois(n_years, 1),
    fgu_losses = map(nlosses, ~rpareto1(.x, 1.2, 2e6)),
    fgu_losses_yr1 = map(fgu_losses, ~.x * .3),
    fgu_losses_yr2 = map(fgu_losses, ~.x * .9),
  )

  pls <- pls |>
    mutate(
      net_losses = map(fgu_losses, ~insurance_conditions(.x, event_limit, event_deductible)),
      net_losses_yr1 = map(fgu_losses_yr1, ~insurance_conditions(.x, event_limit, event_deductible)),
      net_losses_yr2 = map(fgu_losses_yr2, ~insurance_conditions(.x, event_limit, event_deductible)),
      total_gross_net_loss = map_dbl(net_losses, sum),
      total_gross_net_loss_yr1 = map_dbl(net_losses_yr1, sum),
      total_gross_net_loss_yr2 = map_dbl(net_losses_yr2, sum),
      total_net_loss = insurance_conditions(total_gross_net_loss, aal, aad),
      total_net_loss_yr1 = insurance_conditions(total_gross_net_loss_yr1, aal, aad),
      total_net_loss_yr2 = insurance_conditions(total_gross_net_loss_yr2, aal, aad),
    ) 

  pls |>
    summarize(
      yr1 = sum(total_net_loss_yr1) / sum(total_net_loss),
      yr2 = sum(total_net_loss_yr2) / sum(total_net_loss)
    )
}
