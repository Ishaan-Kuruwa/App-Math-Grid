---
title: "How sure can we be about melting glaciers and future weather?"
method: monte-carlo
field: climate
status: reviewed
difficulty: intermediate
summary: >-
  Climate models depend on numbers that are never known exactly, like how much
  sunlight reaches a glacier or how warm the air is. Monte Carlo simulation deals
  with this by running the model thousands of times, each time with inputs picked
  at random from a realistic range, and then looking at the spread of results.
  Researchers did this for a glacier in Switzerland and found that small errors in
  the inputs added up to an uncertainty of about 10% in how much ice melted. A
  related tool is the weather generator: a program that uses random numbers to
  create long, realistic records of daily rain and temperature for a location.
  Testing one at 20 places around the world showed it could reproduce heavy-rain
  extremes well, but did less well with temperature extremes. Flood planners use
  similar simulations to estimate how often a river might overflow as the climate
  changes.
starterQuestion: >-
  Write a simple weather generator for your town: each day, decide whether it
  rains using the chance of rain for that month, and pick a daily temperature at
  random around the monthly average. Use real monthly averages from a weather
  service. Simulate 1,000 years of weather. How often does your generator produce
  a week with no rain at all, and how does that change if you lower the chance of
  rain by 20%?
prerequisites:
  - "Probability and averages"
  - "Reading data tables and histograms"
  - "Basic coding (loops and random numbers)"
papers:
  - title: "Exploring uncertainty in glacier mass balance modelling with Monte Carlo simulation"
    authors:
      - "Horst Machguth"
      - "Ross Stuart Purves"
      - "J. Oerlemans"
      - "Martin Hoelzle"
      - "F. Paul"
    year: 2008
    url: "https://doi.org/10.5194/tc-2-191-2008"
    doi: "10.5194/tc-2-191-2008"
  - title: "Simulation of extreme weather events by a stochastic weather generator"
    authors:
      - "Mikhail A. Semenov"
    year: 2008
    url: "https://doi.org/10.3354/cr00731"
    doi: "10.3354/cr00731"
  - title: "Multi‐Level Monte Carlo Models for Flood Inundation Uncertainty Quantification"
    authors:
      - "Gordon Aitken"
      - "Lindsay C. Beevers"
      - "Mike Christie"
    year: 2022
    url: "https://doi.org/10.1029/2022wr032599"
    doi: "10.1029/2022wr032599"
---
