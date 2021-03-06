// gui
var settings = {};
settings.birdseye = true;
var gui = new dat.GUI();
var birdseyeController = gui.add(settings, 'birdseye');

// bouge la caméra de vue de dessus à vue à échelle.
birdseyeController.onFinishChange(function(value) {
    var rig = document.querySelector('#rig');
    var boxes = document.querySelectorAll('a-box')
    if (value) {
        rig.object3D.position.y = 15;
        rig.setAttribute('rotation', "-90 -192 0");
        boxes.forEach(function(i) {
            i.object3D.scale.x = 0.3;
            i.object3D.scale.z = 0.3;
        });
    } else {
        rig.object3D.position.y = 0;
        rig.setAttribute('rotation', "0 0 0");
        boxes.forEach(function(i) {
            i.object3D.scale.x = 0.03;
            i.object3D.scale.z = 0.03;
        });
    }
  });

// d3
console.log("loading data...");
d3.json('data/EN.json').then(function (data) {
    // calcul des min/max des données pour faire des échelles
    // *_extent[0] = minimum, *_extent[1] = maximum
    console.log("loaded");
    var population_extent = d3.extent(data, function (d) {
        return d.population;
    });

    var longitude_extent = d3.extent(data, function (d) {
        if (d !== undefined) { // au cas où on tombe sur une ligne malformée (?)
            return d.longitude;
        }
    });

    var latitude_extent = d3.extent(data, function (d) {
        if (d !== undefined) {
            return d.latitude;
        }
    });

    // création des échelles des champs qu'on va utiliser
    // ici : échelle linéaire
    // 0 -> 0, population maximum -> 10
    var population_scale = d3.scaleLinear()
        .domain([0, population_extent[1]])
        .range([0, 10]);

    var longitude_scale = d3.scaleLinear()
        .domain([longitude_extent[0], longitude_extent[1]])
        .range([0, 20]);

    var latitude_scale = d3.scaleLinear()
        .domain([latitude_extent[0], latitude_extent[1]])
        .range([0, 30]);
    
    console.log("fini calculs");
    // Lier les objets a-frame et les données :
    var u = d3.select('a-scene') // sélection de la scène a-frame
        .selectAll('a-box.bar') // sélection des cubes
        .data(data) // qu'on lie aux données
    
    // Mise à jour des objets
    u.enter() // pour toutes les nouvelles données
        .append('a-box') // créer un cube s'il n'y en a pas assez
        .classed('bar', true) // lui donner la classe css "bar"
        // on fait correspondre les champs des données à des paramètres visibles
        .attr("height", function(d) { // hauteur du cube -> population
            return population_scale(d.population);
        })
        .attr("position", function(d) {
            x = longitude_scale(d.longitude); // position x -> latitude
            y = population_scale(d.population) / 2; // position y -> population / 2
            z = latitude_scale(d.latitude); // position z -> longitude
            // ici la projection est très simple : x -> latitude, z -> longitude
            // c'est une projection cylindrique (?), très déformée aux pôles
            // mais vu qu'on est sur une petite échelle, la déformation devrait être négligeable
            return x + " " + y + " " + z;
        })
        .attr("color", function() {
            return "#CFD" + (Math.floor(Math.random()*500)+200)
        })
        .attr("scale", "0.3 1 0.3")
    
    // suppression des objets en trop
    u.exit() // pour tous les objets en trop
        .remove();// on vire
});