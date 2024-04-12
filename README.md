## Reinsurance Exercise

All the code and information is available in this repos and the links below.

I got a bit carried away and took probably 6 hours of my free time to code.
It was actually a problem I though about previoulsy and I was planning to build
a small library for reinsurance modeling anyway. Also, I was not familiar with TS
and was curious to learn it.

A couple of remarks:

* I'm not entirely satisfied with my modeling of losses, especially when I got
  to the modeling of lags.
* I haven't used ChatGPT, but I kept Copilot on as I've been experimenting with it
  in past few weeks. I thought it was OK because it's mostly suggesting snippets
  of codes (which I had to modify 95% of the time) for boilerplate and it was
  a huge time saver.

I've solved the problem with R and TS.

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

My first time ever using TypeScript, so be indulgent! You can see a small report in `index.html`, which
is also available here:

[https://dreanod.github.io/solveva/typescript/](https://dreanod.github.io/solveva/typescript/)
