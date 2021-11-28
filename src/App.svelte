<script>
  import { tick } from "svelte";
  import { set } from "idb-keyval";

  export let savedState;

  let name = "";
  let participants = savedState.participants || [];
  let exclusions = savedState.exclusions || {};
  let solution = null;
  let showSolution = false;
  let solutionElement;
  let timeout;
  let loadingMessage = null;
  let solverErrorMessage = null;
  let ariaLiveMessage = null;
  let participantsHeading = null;

  const worker = new Worker("/solver.js");
  worker.onmessage = async function(e) {
    clearTimeout(timeout);
    solution = e.data;
    loadingMessage = null;
    await tick();
    solutionElement.scrollIntoView({behavior: "smooth"});
    solutionElement.focus();
  }

  function saveState() {
    set("santa-state", { participants, exclusions });
  }

  function addParticipant(e) {
    e.preventDefault();
    participants = [...participants, name];
    exclusions = Object.assign(exclusions, {[name]: [name]});
    ariaLiveMessage = `${name} a bien été ajouté.`;
    name = "";
    solution = null;
    saveState();
  }

  function removeParticipant(participant) {
    return function() {
      participants = participants.filter(p => p !== participant);
      delete exclusions[participant];
      const updatedExclusions = {};
      for (name in exclusions) {
        updatedExclusions[name] = exclusions[name].filter(p => p !== participant);
      }
      exclusions = updatedExclusions;
      solution = null;
      saveState();
      ariaLiveMessage = `${participant} a bien été retiré.`;
      participantsHeading.focus();
    }
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
      saveState();
    }
  }

  async function onShowSolutionChange() {
    await tick();
    solutionElement.scrollIntoView({behavior: "smooth"});
  }

  async function solve() {
    if (participants.length < 2) {
      solverErrorMessage =
        "Vous devez ajouter au moins deux participants pour faire un tirage.";
      return;
    }
    solverErrorMessage = null;
    worker.postMessage({
      pairs: participants.flatMap(
        p1 => shuffle(participants).map(p2 => [p1, p2])
      ),
      exclusions,
      solution: [],
      participants
    });
    timeout = setTimeout(() => {
      if (solution === null) {
        loadingMessage = "Calcul en cours...";
      }
    }, 500);
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

<h2 bind:this={participantsHeading} tabindex="-1">Participant·es</h2>
<p>Commencez par entrer les noms des participant·es</p>
<form on:submit={addParticipant}>
  <input
    aria-label="Entrez le nom d'un participant"
    required
    bind:value={name}
  />
  <button>Ajouter</button>
</form>
<ul class="participants">
  {#each participants as participant}
    <li>
      <div>{participant}</div>
      <button
        aria-label={`retirer ${participant}`}
        on:click={removeParticipant(participant)}>&times</button
      >
    </li>
  {/each}
</ul>

<h2>Règles</h2>
<p />
{#if participants.length < 3}
  <p>
    Les règles vous permettront de définir si le tirage doit éviter certaines
    pairs. Vous devez ajouter au moins trois participants pour pouvoir ajouter
    des règles.
  </p>
{:else}
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
{/if}
<h2>Tirage</h2>
{#if solution === null}
  <button on:click={solve}>Lancer un tirage</button>
  {#if solverErrorMessage}
    <p>{solverErrorMessage}</p>
  {/if}
{:else}
  <div tabindex="-1" bind:this={solutionElement}>
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
            on:change={onShowSolutionChange}
          />
          <label for="showSolution">Montrer la solution</label>
        </div>
        {#if showSolution}
          <table class="solution">
            {#each solution as [giver, receiver]}
              <tr>
                <td>{giver}</td>
                <td>➡️</td>
                <td>{receiver}</td>
              </tr>
            {/each}
          </table>
        {/if}
      </section>
    {/if}
    <button class="mt-1" on:click={solve}>Lancer un autre tirage</button>
  </div>
{/if}
{#if loadingMessage !== null}
  <p>{loadingMessage}</p>
{/if}
<div role="status" aria-live="polite" class="visually-hidden">
  {#if ariaLiveMessage !== null}
    {ariaLiveMessage}
  {/if}
</div>

<style>
  ul.participants,
  ul.rules {
    list-style: none;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .participants li {
    border: 1px solid #ccc;
    border-radius: 2px;
    padding: 0.25rem 0.5rem;
    background: #fafafa;
    display: flex;
    gap: 0.5rem;
  }

  .participants li button {
    background: none;
    border: none;
    padding: 0;
    margin: 0;
    font-size: 1.25rem;
    cursor: pointer;
  }

  .participants li button:hover,
  .participants li button:focus {
    text-decoration: underline;
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
  }

  .solution td:first-child {
    text-align: right;
  }

  .solution td:nth-child(2) {
    padding: 0 0.5rem;
  }

  .result-url {
    width: 50ch;
    max-width: 100%;
  }

  .mt-1 {
    margin-top: 1rem;
  }
</style>
