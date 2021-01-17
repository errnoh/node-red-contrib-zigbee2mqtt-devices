module.exports = function (RED) {
    const utils = require("./lib/utils.js");

    RED.httpAdmin.get("/z2m/devices/:broker/:deviceType/:vendor/:model", function (req, res) {
        try {
            var response = {
                success: false,
                message: "",
                devices: []
            };

            var broker = RED.nodes.getNode(req.params.broker.replace("_", "."));

            if (broker === undefined || broker === null) {
                response.message = "Unable to find broker. Pleas deploy first and try it again.";
                res.end(JSON.stringify(response));
                return;
            }

            var devices = broker.getDeviceList();
            var type = req.params.deviceType.toLowerCase();
            var vendor = decodeURI(req.params.vendor).toLowerCase();
            var model = decodeURI(req.params.model).toLowerCase();
            if (model !== "all" && model.includes(",")) {
                model = model.split(",");
            }
            else if (model !== "all") {
                model = [model];
            }

            response.devices = minimizeDeviceList(filterDevices(devices, type, vendor, model));
            response.success = devices.length > 0;
            if(!response.success)
            {
                response.message = "No devices found!";
            }

            console.log("---------------- RESPONSE -----------------");
            console.log(response);
            console.log("-------------------------------------------");

            res.end(JSON.stringify(response));
        } catch (err) {
            res.end(JSON.stringify(response));
            console.log(err);
        }
    });

    function minimizeDeviceList(devices){
        return devices.map((value)=>{
            return {
                friendly_name: value.friendly_name,
                address: value.ieee_address,
                type: value.type,
                model: value.definition.model,
                vendor: value.definition.vendor,
                version: value.software_build_id
            };
        });
    }

    function filterDevices(devices, type, vendor, model){
        return devices.filter(e => {
            try {

                if(e.definition === undefined || e.definition === null){
                    return false;
                }

                var dt = e.type.toLowerCase();
                var dv = "all";
                var dm = "all";

                if (e.definition.vendor) {
                    dv = e.definition.vendor.toLowerCase();
                }

                if (e.definition.model) {
                    dm = e.definition.model.toLowerCase();
                }

                return (dt == type || (type == "enddevice" && dt == "greenpower") || (type == "all" && dt !== "coordinator")) &&
                    (dv == vendor || (vendor == "all")) &&
                    ((model == "all") || model.includes(dm));
            } catch (err) {
                console.log(err);
                console.log(e);
            }
        });
    }

    RED.httpAdmin.get("/z2m/scenes", function (req, res) {
        try {
            var scenes = [];
            RED.nodes.eachNode(n => {
                if (n.type === "scene-in") {
                    if (scenes.every(s => s != n.scene)) {
                        scenes.push(n.scene);
                    }
                }
            });

            res.end(JSON.stringify({
                scenes: scenes
            }));
        } catch (err) {
            console.log(err);
        }
    });
};
