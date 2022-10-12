define(["root/data/story"], function (data) {
    data = data.map(function (a) {
        a.date = new Date(a.date);
        return a;
    });
    data = data.sort(function (a, b) { return a.date - b.date });
    for (var i = 0; i < data.length; i++) {
        data[i].idx = i;
    }
    return data;
});
