// importo la info de index.json
import data from './index.json' assert { type: 'json' };

const body = document.getElementById("body");

console.log(data);
console.log(data.length);

let emails = [];

for (const hola in data) { // recorre el JSON
    console.log(data[hola]);
    let penal = data[hola];
    const div = document.createElement('DIV');
    div.setAttribute("id", penal.id,);
    div.classList.add("div");
    const span = document.createElement("SPAN");
    span.classList.add("span");
    span.textContent = `${penal.id}: ${penal.email}`;
    div.appendChild(span);
    body.appendChild(div);
}


