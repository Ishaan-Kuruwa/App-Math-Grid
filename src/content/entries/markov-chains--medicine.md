---
title: "Following patients from one health state to the next"
method: markov-chains
field: medicine
status: reviewed
difficulty: intermediate
summary: >-
  Many diseases move through stages, such as mild, moderate, and severe, and
  patients can get better, get worse, or stay the same from one year to the next. A
  Markov model sorts patients into these health states and uses transition
  probabilities to say what fraction move between states each year. Running the
  model forward shows how a whole group of patients is likely to spread across the
  states over time. Doctors and health agencies use this to compare treatments and
  to ask whether a treatment is worth its cost. Researchers have used it to track
  rheumatic heart disease in young Australian patients and even to test whether
  eating dark chocolate every day could be a cost-effective way to prevent heart
  attacks and strokes.
starterQuestion: >-
  Build a three-state model (healthy, sick, recovered) where each year 10% of
  healthy people get sick, 50% of sick people recover, and 5% of recovered people
  get sick again. Starting with 1,000 healthy people, how many are in each state
  after 10 years? How much does that change if a treatment raises the recovery rate
  to 70%?
prerequisites:
  - "Basic probability"
  - "Multiplying a table of numbers by a list (matrices are helpful but not required)"
  - "A spreadsheet or basic coding"
papers:
  - title: "Markov Models and Cost Effectiveness Analysis: Applications in Medical Research"
    authors:
      - "Matthieu Komorowski"
      - "Jesse D. Raffa"
    year: 2016
    url: "https://doi.org/10.1007/978-3-319-43742-2_24"
    doi: "10.1007/978-3-319-43742-2_24"
  - title: "The effectiveness and cost effectiveness of dark chocolate consumption as prevention therapy in people at high risk of cardiovascular disease: best case scenario analysis using a Markov model"
    authors:
      - "Ella Zomer"
      - "Alice J. Owen"
      - "Dianna J. Magliano"
      - "Danny Liew"
      - "Christopher Michael Reid"
    year: 2012
    url: "https://doi.org/10.1136/bmj.e3657"
    doi: "10.1136/bmj.e3657"
  - title: "Rheumatic Heart Disease Severity, Progression and Outcomes: A Multi‐State Model"
    authors:
      - "Jeffrey W. Cannon"
      - "K Roberts"
      - "Catherine Milne"
      - "Jonathan Rhys Carapetis"
    year: 2017
    url: "https://doi.org/10.1161/jaha.116.003498"
    doi: "10.1161/jaha.116.003498"
---
