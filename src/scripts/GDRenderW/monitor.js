let prefData = {};

export default {
    startFrame: function() {
        prefData = {
            _total_: window.performance.now()
        };
    },
    startCategory: function(cname) {
        let cat = prefData[cname];

        if (cat == undefined)
            cat = {
                time: 0,
                state: "none",
                last_time: 0,
                name: cname
            }

        cat.state = "recording";
        cat.last_time = window.performance.now();

        prefData[cname] = cat;
    },
    endCategory: function(cname) {
        let cat = prefData[cname];

        if (cat == undefined)
            return;

        cat.time += window.performance.now() - cat.last_time;
        cat.state = "none";

        prefData[cname] = cat;
        return cat;
    },
    endFrame: function(log) {
        if (log) {
            let total_time = window.performance.now() - prefData._total_;
            console.log("Total " + total_time + "ms");
            Object.values(prefData).forEach(e => {
                if (!e.state)
                    return;

                if (e.state == "recording")
                    e = this.endCategory(e.name);

                let perc = Math.floor( e.time / total_time * 1000 ) / 10;

                console.log(`${e.name}   ${e.time}ms   ${perc}%`);
            });
        }
    }
}