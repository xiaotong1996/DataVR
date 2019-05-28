require('aframe');
require('aframe-teleport-controls');
require('./world-scale')
const d3 = require('d3');

AFRAME.registerComponent('pop-angleterre', {
    init: function () {
        // d3
        console.log("loading data...");
        Promise.all([ //Dans mes souvenirs, 'Promise' est dangereux à utiliser mais permet de 'promettre' au compilateur qu'il aura accès à des données pendant ses calculs
            d3.json('data/EN.json'),
            d3.json('data/EN_wealth.json'),
        ]).then(function (data) { //data[0] contient EN.json, data[1] contient EN_wealth.json

            // calcul des min/max des données pour faire des échelles
            // *_extent[0] = minimum, *_extent[1] = maximum
            console.log("loaded");
            var population_extent = d3.extent(data[0], function (d) {
                return d.population;
            });

            var longitude_extent = d3.extent(data[0], function (d) {
                if (d !== undefined) { // au cas où on tombe sur une ligne malformée (?)
                    return d.longitude;
                }
            });

            var latitude_extent = d3.extent(data[0], function (d) {
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
                .select('a-entity.set1') // séléction de la a-entity correspondante au bon set
                .selectAll('a-box.bar1') // sélection des cubes
                .data(data[0]) // qu'on lie aux données

            // Mise à jour des objets
            u.enter() // pour toutes les nouvelles données
                .append('a-box') // créer un cube s'il n'y en a pas assez
                .classed('bar1', true) // lui donner la classe css "bar"
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
                    return "#0000FF" //"#CFD" + (Math.floor(Math.random() * 500) + 200)
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


            //});

            //d3.json('data/EN_wealth.json').then(function (data2) {
            var wealth_extent = d3.extent(data[1], function (d) {
                return d.GCP_MER05;
            });

            var longitude_extent_bis = d3.extent(data[1], function (d) {
                if (d !== undefined) { // au cas où on tombe sur une ligne malformée (?)
                    return d.longitude;
                }
            });

            var latitude_extent_bis = d3.extent(data[1], function (d) {
                if (d !== undefined) {
                    return d.latitude;
                }
            });

            var wealth_scale = d3.scaleLinear()
                .domain([0, wealth_extent[1]])
                .range([0, 10]);

            var v = d3.select('a-scene') // sélection de la scène a-frame
                .select('a-entity.set2')
                .selectAll('a-box.bar2') // sélection des cubes
                .data(data[1]) // qu'on lie aux données

            // Mise à jour des objets
            v.enter() // pour toutes les nouvelles données
                .append('a-box') // créer un cube s'il n'y en a pas assez
                .classed('bar2', true) // lui donner la classe css "bar"
                // on fait correspondre les champs des données à des paramètres visibles
                .attr("height", function (d) { // hauteur du cube -> GCP en 2005
                    return wealth_scale(d.GCP_MER05);
                })
                .attr("position", function (d) {

                    y = wealth_scale(d.GCP_MER05) / 2; // position y -> GCP / 2
                    x = longitude_scale(d.longitude); // position x -> latitude
                    z = latitude_scale(d.latitude); // position z -> longitude
                    // ici la projection est très simple : x -> latitude, z -> longitude
                    // c'est une projection cylindrique (?), très déformée aux pôles
                    // mais vu qu'on est sur une petite échelle, la déformation devrait être négligeable
                    return x + " " + y + " " + z;
                })
                //.attr("color", function () {
                //    return "#FF0000"
                //})
                .attr("material", "color: #F00; opacity: 0.3; transparent: true")
                .attr("scale", "2.2 1 3.9")

            // suppression des objets en trop
            v.exit() // pour tous les objets en trop
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
            geoGenerator({ type: 'FeatureCollection', features: data.features })
            ctx.stroke();

        });

        // state that the material needs to be updated
        material = this.el.getObject3D('mesh').material;
        material.map.needsUpdate = true;
    }
}
);
