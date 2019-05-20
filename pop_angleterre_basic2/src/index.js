require('aframe');
require('aframe-teleport-controls');
require('super-hands');
const dat = require('dat.gui');
const d3 = require('d3');

function lerp(a, b, alpha) {
    return a * (1 - alpha) + b * alpha;
}

AFRAME.registerComponent('debug-gui', {
    init: function () {
        // gui
        var settings = {};
        settings.scale = 1.0;
        var gui = new dat.GUI();
        var scaleController = gui.add(settings, 'scale', 0, 1);

        // bouge la caméra de vue de dessus à vue à échelle.
        scaleController.onChange(function (value) {
            var rig = document.querySelector('#rig');
            var boxes = document.querySelectorAll('a-box');
            rig.object3D.position.y = lerp(0, 15, value);
            rig.object3D.rotation.x = lerp(0, -Math.PI / 2, value);

            boxes.forEach(function (i) {
                i.object3D.scale.x = lerp(0.03, 0.3, value);
                i.object3D.scale.z = lerp(0.03, 0.3, value);
            })
        });
    }
});

AFRAME.registerComponent('world-scale', {
    schema: {
        rightHand: {
            type: "selector"
        },
        leftHand: {
            type: "selector"
        },
        world: {
            type: "selector"
        }
    },
    init: function () {
        this.SCALE_EVENT = 'gripdown';
        this.UNSCALE_EVENT = 'gripup';
        this.RHandState = false;
        this.LHandState = false;
        this.scaling = false;
        this.scale = 1;
        this.RHandPos = new THREE.Vector3();
        this.LHandPos = new THREE.Vector3();

        this.el.addEventListener("scale-start", this.scaleStart);
        this.el.addEventListener("scale-stop", this.scaleStop);

        this.data.rightHand.addEventListener(this.SCALE_EVENT, function () {
            document.querySelector("[world-scale]").emit("scale-start", { "hand": "R" });
        });
        this.data.leftHand.addEventListener(this.SCALE_EVENT, function () {
            document.querySelector("[world-scale]").emit("scale-start", { "hand": "L" });
        });
        this.data.leftHand.addEventListener(this.UNSCALE_EVENT, function () {
            document.querySelector("[world-scale]").emit("scale-stop", { "hand": "L" });
        });
        this.data.rightHand.addEventListener(this.UNSCALE_EVENT, function () {
            document.querySelector("[world-scale]").emit("scale-stop", { "hand": "R" });
        });
    },
    tick: function () {
        if (this.scaling) {
            this.data.rightHand.object3D.getWorldPosition(this.RHandPos);
            this.data.leftHand.object3D.getWorldPosition(this.LHandPos);
            const currentStretch = this.RHandPos.distanceTo(this.LHandPos);
            var deltaStretch;
            if (this.previousStretch !== null && currentStretch != 0) {
                deltaStretch = currentStretch - this.previousStretch
            } else {
                deltaStretch = 0;
            }
            this.previousStretch = currentStretch;
            // scaling code
            this.scale += deltaStretch;
            if (this.scale > 1) this.scale = 1;
            if (this.scale < 0) this.scale = 0;
            this.updateScale();
        }
        else { this.previousStretch = null }
    },
    scaleStart: function (evt) {
        if (evt.detail.hand == "R") this.RHandState = true;
        if (evt.detail.hand == "L") this.LHandState = true;

        // si les deux mains sont pressées
        if (this.RHandState && this.LHandState) {
            console.log("gripdown !");
            // update scaling to true
            document.querySelector("[world-scale]").components["world-scale"].scaling = true;
        }
    },
    scaleStop: function (evt) {
        if (evt.detail.hand == "R") this.RHandState = false;
        if (evt.detail.hand == "L") this.LHandState = false;
        console.log("gripup !");
        // update scaling to false
        document.querySelector("[world-scale]").components["world-scale"].scaling = false;
    },
    updateScale: function() {
        var rig = document.querySelector('#rig');
        //var boxes = document.querySelectorAll('a-box');
        rig.object3D.position.y = lerp(15, 0, this.scale);
        rig.object3D.rotation.x = lerp(-Math.PI / 2, 0, this.scale);
    }
});

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
                .range([20, 0]);
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

            // suppression des objets en trop
            u.exit() // pour tous les objets en trop
                .remove();// on vire
        });
    }
});