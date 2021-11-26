onmessage = function(e) {
  const result = solve(e.data);
  postMessage(result);
};

/* This is a backtracking algorithm */
function solve(problem) {
  if (isInvalid(problem)) {
    return false;
  }
  if (isDone(problem)) {
    return problem.solution;
  }
  return exploreBranches(problem.pairs, problem);
}

function isInvalid({ solution, exclusions }) {
  return (
    solution.some(([giver, receiver]) =>
      exclusions[giver].includes(receiver)
    ) ||
    givesMultipleTimes(solution) ||
    receivesMultipleTimes(solution)
  );
}

function givesMultipleTimes(solution) {
  const givers = solution.map(([giver, receiver]) => giver);
  return givers.some((giver, i) => givers.slice(i + 1).includes(giver));
}

function receivesMultipleTimes(solution) {
  const receivers = solution.map(([giver, receiver]) => receiver);
  return receivers.some((receiver, i) =>
    receivers.slice(i + 1).includes(receiver)
  );
}

function isDone({ participants, solution }) {
  return solution.length === participants.length;
}

function exploreBranches(pairs, problem) {
  if (pairs.length === 0) {
    return false;
  }
  const pair = pairs[0];
  const result = solve(assign(problem, pair));
  if (result === false) {
    return exploreBranches(pairs.slice(1), problem);
  } else {
    return result;
  }
}

function assign(problem, pair) {
  const newProblem = { ...problem };
  const newSolution = problem.solution.concat([pair]);
  newProblem.solution = newSolution;
  return newProblem;
}
