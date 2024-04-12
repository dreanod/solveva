source("functions.R")

set.seed(1)

####### Exercise 1 #######

covers_df <- tibble(
  event_limit = c(Inf, 10e6, 10e6, 10e6, 10e6),
  event_deductible = c(0, 5e6, 5e6, 5e6, 5e6),
  aal = c(Inf, Inf, Inf, 12e6, 12e6),
  aad = c(0, 0, 2e6, 0, 2e6)
)

cbind(
  covers_df,
  pmap_dfr(covers_df, simulate_xl)
)


####### Exercise 2 #######

pmap_dfr(covers_df, dev_pattern)
