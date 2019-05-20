function lerp(a, b, alpha) {
    return a * (1 - alpha) + b * alpha;
}

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
        this.scale = 0;
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