<script>
  let name = "";
  let participants = [];
  let exclusions = {};
  let solution = null;
  let showSolution = false;

  function addParticipant(e) {
    e.preventDefault();
    participants = [...participants, name];
    exclusions = Object.assign(exclusions, {[name]: [name]});
    name = "";
    solution = null;
  }

  function updateExclusion(giver, receiver) {
    return function(e) {
      if (e.target.checked) {
        exclusions = Object.assign(
          exclusions,
          {[giver]: exclusions[giver].filter(r => r !== receiver)}
        );
      } else {
        exclusions = Object.assign(
          exclusions,
          {[giver]: [...exclusions[giver], receiver]}
        );
      }
    }
  }

  function solve() {
    solution = doSolve({
      pairs: participants.flatMap(p1 => shuffle(participants).map(p2 => [p1, p2])),
      exclusions,
      solution: []
    });
  }

  function doSolve(problem) {
    if (isInvalid(problem)) {
      return false;
    }
    if(isDone(problem)) {
      return problem.solution;
    }
    return exploreBranches(
      problem.pairs,
      problem
    );
  }

  function isInvalid({solution, exclusions}) {
    return solution.some(([giver, receiver]) => exclusions[giver].includes(receiver))
      || givesMultipleTimes(solution)
      || receivesMultipleTimes(solution);
  }

  function givesMultipleTimes(solution) {
    const givers = solution.map(([giver, receiver]) => giver);
    return givers.some((giver, i) => givers.slice(i + 1).includes(giver));
  }

  function receivesMultipleTimes(solution) {
    const receivers = solution.map(([giver, receiver]) => receiver);
    return receivers.some((receiver, i) => receivers.slice(i + 1).includes(receiver));
  }

  function isDone({solution}) {
    return solution.length === participants.length;
  }

  function exploreBranches(pairs, problem) {
    if (pairs.length === 0) {
      return false;
    }
    const pair = pairs[0];
    const result = doSolve(assign(problem, pair));
    if (result === false) {
      return exploreBranches(pairs.slice(1), problem);
    } else {
      return result;
    }
  }

  function assign(problem, pair) {
    const newProblem = {...problem};
    const newSolution = problem.solution.concat([pair]);
    newProblem.solution = newSolution;
    return newProblem;
  }

  // https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
  function shuffle(originalArray) {
    const array = [...originalArray];
    let currentIndex = array.length,  randomIndex;
    // While there remain elements to shuffle...
    while (currentIndex != 0) {
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
    return array;
  }
</script>

<main>
  <h1>Secret Santa Planner</h1>
  <p>
    Cette application vous aidera à déterminer qui offre un cadeau à qui dans un
    jeu de <em>Secret Santa</em>. Vous définissez les participants, puis ajoutez
    des règles. Par exemple on évite que les couples s'offrent des cadeaux entre
    eux, ou bien on peut définir que X ne doit pas tomber sur Y car c'était le
    résultat de l'année précédente.
  </p>

  <h2>Participants</h2>
  <form on:submit={addParticipant}>
    <label for="name">Nom</label>
    <input required bind:value={name} id="name" />
    <button>Ajouter</button>
  </form>
  <p>{participants.join(", ")}</p>

  {#if participants.length > 1}
    <h2>Règles</h2>
    <ul class="rules">
      {#each participants as participant}
        <li class="flow">
          <div>
            <span class="can-give-to">{participant}</span> peut offrir à :
          </div>
          <div>
            {#each participants.filter(p => p !== participant) as receiver}
              <div>
                <input
                  id={`${participant}_${receiver}`}
                  type="checkbox"
                  checked={!exclusions[participant].includes(receiver)}
                  on:change={updateExclusion(participant, receiver)}
                />
                <label for={`${participant}_${receiver}`}>{receiver}</label>
              </div>
            {/each}
          </div>
        </li>
      {/each}
    </ul>
    <button on:click={solve}>Lancer les calculs</button>
    {#if solution !== null}
      <h2>Résultat</h2>
      {#if solution === false}
        <p>
          Aucune solution n'a été trouvée. Vos règles sont probablement trop
          restrictives.
        </p>
      {:else}
        <p>
          Partagez cette url avec les participants pour que chacun·e puisse
          découvrir à qui il·elle offrira un cadeau cette année.
        </p>
        <input
          class="result-url"
          readonly
          value={`https://santa.kimlaitrinh.me/resultat?data=${encodeURI(
            btoa(JSON.stringify(solution))
          )}`}
        />
        <section id="solution" class="flow">
          <div>
            <input
              id="showSolution"
              type="checkbox"
              bind:checked={showSolution}
            />
            <label for="showSolution">Montrer la solution</label>
          </div>
          {#if showSolution}
            <div class="solution">
              {#each solution as [giver, receiver]}
                <div>{giver}</div>
                <div>➡️</div>
                <div>{receiver}</div>
              {/each}
            </div>
          {/if}
        </section>
      {/if}
    {/if}
  {/if}
</main>

<style>
  ul.rules {
    list-style: none;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .rules li {
    padding: 1.4rem;
    border: 1px solid #ccc;
    border-radius: 2px;
  }

  .can-give-to {
    font-weight: bold;
    font-size: 1.2rem;
  }

  #solution {
    margin-top: 2rem;
  }

  .solution {
    margin-top: 1rem;
    display: grid;
    grid-template-columns: repeat(3, max-content);
    gap: 0.5rem;
  }

  .solution > :nth-child(3n + 1) {
    text-align: right;
  }

  .result-url {
    width: 50ch;
    max-width: 100%;
  }
</style>
