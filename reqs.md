# Requirements document

## Introduction

I want to develop a visualization app for a scientific research experiment.

## People, traits and clubs

We have N people in a city (N is a parameter). Every person has a trait T, for example gender, with values M or F.

In the city, there are C clubs, mathematically represented by sets. C is a parameter.

The experiment considers a turn (time tick) based system. In each time tick, each person makes one decision:

- Either attempts to join clubs (with probability 1/C for each club)
- Or attempts to leave clubs they are currently member of

This means that in a single turn, a person can:

- Join multiple clubs (if they chose to attempt joining)
- Leave multiple clubs (if they chose to attempt leaving)
But they cannot both join and leave clubs in the same turn.

## Joining a club

A person can join every club with a probability 1/C. So if there are 3 clubs, a person has a 1/3 chance to join any of them. This means that a person can join multiple clubs in one turn.

## Leaving a club

Every member of the club can leave the club they are member of with the probability L, given by the function l.
Function l is a parameter, taking the person p and the club c.
Initially, l is given as

l(p, c) = 1 - count(c, t(p) / count(c))

whereby:

- count (a, b) gives the count of trait b in club a.
- count(a) gives the count of all members of club a.
- t(p) gives the trait of person p.

This means that the person has a greater chance to leave a club if their trait is a stronger minority.

## Visualization

The visualization should show a dashboard with the following information:

- The parameters should be displayed in the top of the screen and they should be modifiable
- the clubs should be shown as circles
- the members should be shown as dots, with their traits shown as colors. There should be a legend explaining what trait corresponds with what color
- There should be a button to take 1 turn, or 10 turns, or 100 turns
- there should be a button to start a run and to stop a run. When a run is started, the turns are taken in rapid succession.
- After each turn, the display should be updated with the new situation.

The goal of the experiment is to see whether a certain initial condition leads to a "steady state" after a certain amount of turns.
