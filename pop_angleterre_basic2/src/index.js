require('aframe');
require('aframe-teleport-controls');
require('./world-scale')
const d3 = require('d3');

AFRAME.registerComponent('pop-angleterre', {
    init: function () {
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
                .range([30, 0]);

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
                .attr("height", function (d) { // hauteur du cube -> population
                    return population_scale(d.population);
                })
                .attr("position", function (d) {

                    y = population_scale(d.population) / 2; // position y -> population / 2
                    x = longitude_scale(d.longitude); // position x -> latitude
                    z = latitude_scale(d.latitude); // position z -> longitude
                    // ici la projection est très simple : x -> latitude, z -> longitude
                    // c'est une projection cylindrique (?), très déformée aux pôles
                    // mais vu qu'on est sur une petite échelle, la déformation devrait être négligeable
                    return x + " " + y + " " + z;
                })
                .attr("color", function () {
                    return "#CFD" + (Math.floor(Math.random() * 500) + 200)
                })
                .attr("scale", "0.3 1 0.3")
                .on("mouseenter", function (d) {
                    document.getElementById("cityText").setAttribute("text", "value", d.key);
                    document.getElementById("populationText").setAttribute("text", "value", d.population);
                })
                .on("mouseleave", function(d) {
                    document.getElementById("cityText").setAttribute("text", "value", "");
                    document.getElementById("populationText").setAttribute("text", "value", "");
                });

            // suppression des objets en trop
            u.exit() // pour tous les objets en trop
                .remove();// on vire
        });
    }
});

AFRAME.registerComponent('ukmap', {
    schema: { canvas: { type: 'selector' } },
    init: function () {
        
        var canvas = this.canvas = this.data.canvas;
        var ctx = this.ctx = canvas.getContext('2d');
        // fill red for debug
        ctx.fillStyle = 'rgb(255, 0, 0)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        var projection = d3.geoAlbers()
            .center([0, 55.4])
            .rotate([4.4, 0])
            .parallels([50, 60])
            .scale(6000)
            .translate([canvas.width / 2, canvas.height / 2]);

        var geoGenerator = d3.geoPath()
            .projection(projection)
            .context(this.ctx)

        d3.json("data/terrain.json").then(function (data) {
            console.log("coucou")

            ctx.lineWidth = 0.5;
            ctx.strokeStyle = '#aaa';
            
            // fix me !!!
            ctx.beginPath();
            geoGenerator({type: 'FeatureCollection', features: data.features})
            ctx.stroke();

        });

        // state that the material needs to be updated
        material = this.el.getObject3D('mesh').material;
        material.map.needsUpdate = true;
    }
}
);
