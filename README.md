# clubviz

Visualizer for the club distribution problem.

## Run in development mode

You need nodejs and npm installed. Then, run the following command:

```bash
cd <repo-dir>
npx live-server
```

This will start a http server on port 8080 on localhost which you can point your browser to.
`live-server` will reload whenever a file inside `repo-dir` or its subdirs is changed.

## TODO

- [x] Remove the line showing the trait labels and trait counts. Display the counts of traits by showing only the number on both sides of the bar chart
- [x] Display clubs in a grid so they don't overlap. Determine the maximum grid width using the available screen real estate.
- [ ] Add a graph under each club circle. The graph's X axis is from 0 to the current turn number. The Y axis is between 0 and 1. At each turn, the graph should display a dot representing the ratio between traits (so traitA / traitB if traitA < traitB, else traitB / traitA). Alternatively, the graph can display the ratio traitA / totalMembers or traitB / totalMembers. The graph serves the purpose of determining the convergent ratio the club distribution.
Please use a graphing library for this that takes care of proper axis and tick drawing so we can focus on displaying the values. The graph should resemble a so-called "sparkle" chart used for historic overview of a changing value.
- [ ] Make the visualization responsive so it works well on a mobile phone
