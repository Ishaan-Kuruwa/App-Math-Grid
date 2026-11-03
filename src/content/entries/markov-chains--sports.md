---
title: "Turning tennis points and basketball possessions into win probabilities"
method: markov-chains
field: sports
status: reviewed
difficulty: intro
summary: >-
  Many sports move step by step from one situation to the next: a tennis game goes
  from 15-0 to 15-15 to 30-15, and a basketball possession goes from inbound to
  pass to shot. A Markov chain describes each situation as a "state" and gives the
  probability of moving to each next state. Once you know those probabilities, you
  can calculate how likely a player is to win a whole game or set from the chance of
  winning a single point. Researchers have used this idea on matches between
  Djokovic, Federer, and Nadal, mapped the flow of a basketball game into states,
  and tested which table tennis tactics change a player's chance of winning.
starterQuestion: >-
  If a tennis player wins 60% of the points they serve, what is their chance of
  winning a service game? Draw the scores as states, fill in the transition
  probabilities, and compute the answer, then check it with a simulation in a
  spreadsheet or code. How does the answer change at 55% or 70%?
prerequisites:
  - "Basic probability (multiplying and adding probabilities)"
  - "Drawing diagrams of states and arrows"
  - "A spreadsheet or basic coding"
papers:
  - title: "A new markovian model for tennis matches"
    authors:
      - "Andrea Carrari"
      - "Marco Ferrante"
      - "Giovanni Fonseca"
    year: 2017
    url: "https://doi.org/10.1285/i20705948v10n3p693"
    doi: "10.1285/i20705948v10n3p693"
  - title: "Analysis of basketball game states and transition probabilities using the Markov chains"
    authors:
      - "Igor D. Jelaska"
      - "Slavko Trninić"
      - "Ante Perica"
    year: 2012
    url: "https://doi.org/10.5937/fizkul1201015j"
    doi: "10.5937/fizkul1201015j"
  - title: "Performance Analysis in Table Tennis - Stochastic Simulation by Numerical Derivation"
    authors:
      - "Simon Wenninger"
      - "Martin Lames"
    year: 2016
    url: "https://doi.org/10.1515/ijcss-2016-0002"
    doi: "10.1515/ijcss-2016-0002"
---
