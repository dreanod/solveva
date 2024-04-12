## Reinsurance Exercise

All the code and information is available here. 

I've solved the problem in two different ways.

### With R

#### Results

The results are obtained by running `run_simulation.R`, which depends on `functions.R`.

This is the languages I'm the most used to, so I started with this one to make sure I get
the right results. I used more advanced packages like `tidyverse` (data manipulation) and 
`actuar` (pareto distribution). I consided reprogramming only using base R function but
given that I then solved the problem using TypeScript, I thought it was OK.

#### Application

I thought it could be nice to have a small app that allows a user to modify the parameters
of the simulation and recalculate the result dynamically. The app is hosted here:

[denis-dreano.shinyapps.io/solveva/](https://denis-dreano.shinyapps.io/solveva/)

Have a look! 😀 (it will also show the results to the base exercise)

There is a lot more we can do here (change frequency/severity distributions), but I had to
restrain myself.

The app code is in `app.R`

### With TypeScript

My first time ever using TypeScript so be indulgent! You can see a small report in `index.html`.
