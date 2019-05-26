require('aframe');
require('aframe-teleport-controls');
require('super-hands');
const dat = require('dat.gui');
const d3 = require('d3');

function lerp(a, b, alpha) {
    return a * (1 - alpha) + b * alpha;
}

document.addEventListener("DOMContentLoaded", function () {

    // gui
    var settings = {};
    settings.birdseye = 1.0;
    var gui = new dat.GUI();
    var birdseyeController = gui.add(settings, 'birdseye', 0, 1);

    // bouge la caméra de vue de dessus à vue à échelle.
    birdseyeController.onChange(function (value) {
        var rig = document.querySelector('#rig');
        var boxes = document.querySelectorAll('a-box');
        rig.object3D.position.y = lerp(0, 15, value);
        rig.object3D.rotation.x = lerp(0, -Math.PI / 2, value);

        boxes.forEach(function (i) {
            i.object3D.scale.x = lerp(0.03, 0.3, value);
            i.object3D.scale.z = lerp(0.03, 0.3, value);
        })

        //rig.object3D.rotation.y = lerp(0, -3*Math.PI/2, value);
        /*
        if (value) {
            rig.setAttribute('rotation', "-90 -192 0");
            boxes.forEach(function (i) {
                i.object3D.scale.x = 0.3;
                i.object3D.scale.z = 0.3;
            });
        } else {
            rig.setAttribute('rotation', "0 0 0");
            boxes.forEach(function (i) {
                i.object3D.scale.x = 0.03;
                i.object3D.scale.z = 0.03;
            });
        }
        */
    });

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
            .range([20, 0]);
        var latitude_scale = d3.scaleLinear()
            .domain([latitude_extent[0], latitude_extent[1]])
            .range([30, 0]);
            
        console.log("fini calculs");
        // Lier les objets a-frame et les données :
        var u = d3.select('a-scene') // sélection de la scène a-frame
            .select('a-entity.set1') // séléction de la a-entity correspondante au bon set
            .selectAll('a-box.bar') // sélection des cubes
            .data(data[0]) // qu'on lie aux données
            
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
                return "#0000FF" //"#CFD" + (Math.floor(Math.random() * 500) + 200)
            })
            .attr("scale", "0.3 1 0.3")

        // suppression des objets en trop
        u.exit() // pour tous les objets en trop
            .remove();// on vire
        
        
    //});

    //d3.json('data/EN_wealth.json').then(function (data2) {
        var population_extent_bis = d3.extent(data[1], function (d) {
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

        var population_scale_bis = d3.scaleLinear()
            .domain([0, population_extent_bis[1]])
            .range([0, 10]);
        var longitude_scale_bis = d3.scaleLinear()
            .domain([longitude_extent_bis[0], longitude_extent_bis[1]])
            .range([20, 0]);
        var latitude_scale_bis = d3.scaleLinear()
            .domain([latitude_extent_bis[0], latitude_extent_bis[1]])
            .range([30, 0]);

        var v = d3.select('a-scene') // sélection de la scène a-frame
            .select('a-entity.set2') 
            .selectAll('a-box.bar') // sélection des cubes
            .data(data[1]) // qu'on lie aux données

        // Mise à jour des objets
        v.enter() // pour toutes les nouvelles données
            .append('a-box') // créer un cube s'il n'y en a pas assez
            .classed('bar', true) // lui donner la classe css "bar"
        // on fait correspondre les champs des données à des paramètres visibles
            .attr("height", function (d) { // hauteur du cube -> GCP en 2005
                return population_scale_bis(d.GCP_MER05);
            })
            .attr("position", function (d) {
                
                y = population_scale_bis(d.population) / 2; // position y -> population / 2
                x = longitude_scale_bis(d.longitude); // position x -> latitude
                z = latitude_scale_bis(d.latitude); // position z -> longitude
                // ici la projection est très simple : x -> latitude, z -> longitude
                // c'est une projection cylindrique (?), très déformée aux pôles
                // mais vu qu'on est sur une petite échelle, la déformation devrait être négligeable
                return x + " " + y + " " + z;
            })
            .attr("color", function () {
                return "#FF0000"
            })
            .attr("scale", "0.3 1 0.3")
        
        // suppression des objets en trop
        v.exit() // pour tous les objets en trop
            .remove();// on vire
    });
});
