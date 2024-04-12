library(shiny)
library(tidyverse)
library(actuar)
library(scales)

source("functions.R")

ui <- fluidPage(
  titlePanel("Solveva"),
  sidebarLayout(
    sidebarPanel(
      numericInput("nyears", "Number of Simulated Years", value = 1e5),
      numericInput("event_limit", "Event Limit", value = 10e6),
      numericInput("event_deductible", "Event Deductible", value = 5e6),
      numericInput("aal", "Aggregate Annual Loss", value = 12e6),
      numericInput("aad", "Aggregate Annual Deductible", value = 2e6)
    ),
    mainPanel(
      plotOutput("dist_plot"),
      verbatimTextOutput("xl_results"),

      h2("Exercise 1: Reinsurance structures"),
      p("This will take a few seconds to load."),
      tableOutput("ex1_results"),

      h2("Exercise 2: Development pattern"),
      p("These are the average aggregate (incremental) losse development patterns."),
      tableOutput("ex2_results"),
    )
  )
)

covers_df <- tibble(
  structure = c(
    "10m xs 5m",
    "10m xs 5m, AAD 2m",
    "10m xs 5m, AAL 12m.",
    "10m xs 5m, AAD 2m, AAL 12m"
  ),
  event_limit = c(10e6, 10e6, 10e6, 10e6),
  event_deductible = c( 5e6, 5e6, 5e6, 5e6),
  aal = c(Inf, Inf, 12e6, 12e6),
  aad = c(0, 2e6, 0, 2e6)
)

server <- function(input, output) {

  event_limit <- reactive({
    if (is.na(input$event_limit)) Inf else input$event_limit
  })

  event_deductible <- reactive({
    if (is.na(input$event_deductible)) 0 else input$event_deductible
  })

  aal <- reactive({
    if (is.na(input$aal)) Inf else input$aal
  })

  aad <- reactive({
    if (is.na(input$aad)) 0 else input$aad
  })

  pls <- reactive({
    simulate_annual_losses(
      event_limit = event_limit(),
      event_deductible = event_deductible(),
      aal = aal(),
      aad = aad(),
      n_years = input$nyears
    )
  })

  output$dist_plot <- renderPlot({
    df <- tibble(
      return_period = 10:1000,
      percentile = 1 - 1 / return_period,
      loss = quantile(pls()$total_net_loss, percentile)
    )
    ggplot(df, aes(return_period, loss)) +
      geom_line() +
      scale_x_log10() +
      scale_y_continuous(labels = scales::dollar_format()) +
      labs(
        title = "Annual Aggregate Exceedance Probabiliy Curve",
        x = "Return Period (Years)",
        y = "Aggregate Loss ($)"
      ) +
      theme(
        text = element_text(size = 16)
      )
  })

  output$xl_results <- renderPrint({
    pls() |> aggregate_annual_losses() |>
      mutate(
        across(mean_net_loss:premium, ~comma(.x, accuracy = 1))
      )
  })

  output$ex1_results <- renderTable({
    cbind(
      covers_df |> select(structure),
      pmap_dfr(covers_df, simulate_xl)
    ) |>
      mutate(
        across(mean_net_loss:premium, ~comma(.x, accuracy = 1))
      )
  })

  output$ex2_results <- renderTable({
    res <- pmap_dfr(covers_df, dev_pattern)
    res <- res |>
      mutate(
        pattern_yr_1 = yr1,
        pattern_yr_2 = yr2 - yr1,
        pattern_yr_3 = 1 - yr2,
        across(pattern_yr_1:pattern_yr_3, ~percent(.x, accuracy = .01))
      ) |>
      select(-yr1, -yr2)

    cbind(
      covers_df |> select(structure),
      res
    )
  })
}

shinyApp(ui = ui, server = server)
