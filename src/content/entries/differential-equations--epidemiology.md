---
title: "Modeling disease outbreaks with differential equations"
method: differential-equations
field: epidemiology
status: reviewed
difficulty: intro
summary: >-
  A differential equation describes how something changes from moment to moment.
  The classic SIR model splits a population into three groups (Susceptible,
  Infected, and Recovered) and uses three linked equations to say how fast people
  move from one group to the next. With only basic calculus, you can use the model
  to find the basic reproduction number, R₀: the average number of people one sick
  person infects in a population where no one is immune yet. If R₀ is above 1 the
  outbreak grows, and if it is below 1 it dies out. Vaccination and social
  distancing work by pushing that number down.
starterQuestion: >-
  Using an SIR model of a flu outbreak in a school of 1,000 students, how does
  vaccinating some of the students beforehand change the peak number of sick
  students, and what share has to be vaccinated to stop the outbreak from growing
  at all?
prerequisites:
  - "Derivatives as rates of change"
  - "Basic algebra"
papers:
  - title: "An Introduction to Compartmental Modeling for the Budding Infectious Disease Modeler"
    authors:
      - "Julie C. Blackwood"
      - "Lauren M. Childs"
    year: 2018
    url: "https://doi.org/10.30707/lib5.1blackwood"
    doi: "10.30707/lib5.1blackwood"
  - title: "The SIR model and the Foundations of Public Health"
    authors:
      - "Howard M. Weiss"
    year: 2013
    # No DOI on OpenAlex; cited by its OpenAlex ID (W888141997).
    url: "https://openalex.org/W888141997"
  - title: "An Introduction to The Basic Reproduction Number in Mathematical Epidemiology"
    authors:
      - "Antoine Perasso"
    year: 2018
    url: "https://doi.org/10.1051/proc/201862123"
    doi: "10.1051/proc/201862123"
---
