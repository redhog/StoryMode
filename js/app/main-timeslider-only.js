/* Commented out sections loads the UI */

define([
  "shims/async/main",
  "shims/jQuery/main",
  "app/Visualization/UI/Widgets/Timeline/Timeline",
  "app/Visualization/UI/Widgets/Timeline/TimeLabel",
  "app/map",
  'libs/ol/ol',
  "app/data",
], function (
  async,
  $,
  Timeline,
  TimeLabel,
  map,
  ol,
  data
) {
  $(document).ready(function () {

    map.updateSize();
      
    timeline = new Timeline({
      'class': 'main-timeline',
      startLabelPosition: 'inside',
      lengthLabelPosition: 'inside',
      endLabelPosition: 'inside',

      startLabelTitle: false,
      lengthLabelTitle: false,
      endLabelTitle: false,

      dragHandles: false,

      zoomPosition: 'left',
      maxWindowSize: 1000*60*60*24*365*42,
      windowStart: new Date('2016-03-06'),
      windowEnd: new Date('2021-03-06'),

      rangemarks: [
          {start:new Date('1979-04-24'), end:new Date('2021-03-06'), css:{background:"#ffffff", 'z-index': 0, opacity: 1.0}},
          
          {start:new Date('2000-07-14'), end:new Date('2001-07-14'), cls: "period", css:{'z-index': 1, opacity: 1.0}},
          {start:new Date('2005-01-01'), end:new Date('2006-07-21'), cls: "period", css:{'z-index': 1, opacity: 1.0}},
          {start:new Date('2017-07-01'), end:new Date('2020-03-01'), cls: "period", css:{'z-index': 1, opacity: 1.0}},
          {start:new Date('2014-12-25'), end:new Date('2114-12-25'), cls: "saghar", css:{'z-index': 1, opacity: 1.0}},
      ],
      backgroundCss: {background: "#aaaaaa"},

      windowTimeLabels: new TimeLabel({
        includeDatePrefix: true,
        fullDates: true,
        neverJustHours: true
      }),        
    });
    timeline.placeAt($(".timeslider")[0]);

    iconStyles = {
        "default": new ol.style.Style({
          zIndex: 0,
          image: new ol.style.Icon({
            anchor: [0.5, 0.5],
            anchorXUnits: 'fraction',
            anchorYUnits: 'fraction',
            src: 'img/icon.red.svg',
            opacity: 0.4,
            scale:0.2
          })
        }),
        "default-selected": new ol.style.Style({
          zIndex: 1,
          image: new ol.style.Icon({
            anchor: [0.5, 0.5],
            anchorXUnits: 'fraction',
            anchorYUnits: 'fraction',
            src: 'img/icon.red.selected.svg',
            scale:0.2
          })
        }),
        "home": new ol.style.Style({
          zIndex: 0,
          image: new ol.style.Icon({
            anchor: [0.5, 0.5],
            anchorXUnits: 'fraction',
            anchorYUnits: 'fraction',
            src: 'img/home.svg',
            opacity: 1.0,
            scale:0.1
          })
        }),
        "home-selected": new ol.style.Style({
          zIndex: 1,
          image: new ol.style.Icon({
            anchor: [0.5, 0.5],
            anchorXUnits: 'fraction',
            anchorYUnits: 'fraction',
            src: 'img/home.selected.svg',
            scale:0.1
          })
        })
    };
    lineStyle = new ol.style.Style({
      stroke: new ol.style.Stroke({
        color: '#990000',
        width: 0.5
      })
    });
    lineStyleHidden = new ol.style.Style({
      stroke: null
    });
     
    var vectorSource = new ol.source.Vector();
    var vectorLayer = new ol.layer.Vector({source: vectorSource});
    map.addLayer(vectorLayer);

    var lines = [];
    var prev = null;
    data.map(function (d) {
      if (d.url) {
        d.image = $("<img>");
        d.image.attr("src", d.url);
      } else if (d.html) {
        d.image = $(d.html);
      }
      d.image.addClass("image-item");
        d.image.css({opacity: 0.0, display: "none"});
      $(".image").append(d.image);

      iconFeature = new ol.Feature({
        geometry: new ol.geom.Point(ol.proj.fromLonLat([d.lon, d.lat])),
      });
      var iconStyle = iconStyles[d.type || "default"];
      iconFeature.setStyle(iconStyle);
      vectorSource.addFeature(iconFeature);
      iconFeature.idx = d.idx;
      d.icon = iconFeature;
        
      if (prev != null) {
        var featureLine = new ol.Feature({
          geometry: new ol.geom.LineString([ol.proj.fromLonLat([prev.lon, prev.lat]), ol.proj.fromLonLat([d.lon, d.lat])])
        });
        featureLine.setStyle(lineStyle);
        vectorSource.addFeature(featureLine);
        featureLine.startIdx = prev.idx;
        featureLine.startDate = prev.date;
        featureLine.endDate = d.date;
        featureLine.endIdx = d.idx;
        lines.push(featureLine);
      }
        
      prev = d;
    });


    function flyTo(args) {
      var view = map.getView();
      var duration = 500;
      var zoom = view.getZoom();
      var parts = 2;
      var called = false;
      function callback(complete) {
        --parts;
        if (called) {
          return;
        }
        if (parts === 0 || !complete) {
          called = true;
          args.done(complete);
        }
      }
      view.animate({center: args.location, duration: duration}, callback);
      view.animate(
        {zoom: zoom - 1, duration: duration / 2},
        {zoom: args.zoom || zoom, duration: duration / 2},
        callback
      );
    }

    forward = false;
    current_image = -1;
    var set_current = function(idx) {
      var prev_image = current_image;
      if (prev_image == idx) return;
      if (prev_image != -1) {
        data[prev_image].image.animate({opacity: 0}, 400, "swing", function () {
          data[prev_image].image.css({display: "none"});
        });
        var iconStyle = iconStyles[data[prev_image].type || "default"];
        data[prev_image].icon.setStyle(iconStyle);
      }
      if (idx != -1) {
        data[idx].image.css({display: "block"});
        data[idx].image.animate({opacity: 1});
        var iconStyle = iconStyles[(data[idx].type || "default") + "-selected"];
        data[idx].icon.setStyle(iconStyle);

        var ext = ol.extent.buffer(data[idx].icon.getGeometry().getExtent(), 0);
        if (forward) {
          if (data[idx-1]) ol.extent.extend(ext, data[idx-1].icon.getGeometry().getExtent());
        } else {
          if (data[idx+1]) ol.extent.extend(ext, data[idx+1].icon.getGeometry().getExtent());
        }
        var v = map.getView();
        flyTo({
            location: ol.proj.fromLonLat([data[idx].lon, data[idx].lat]),
            zoom: v.getZoomForResolution(v.getResolutionForExtent(ext)),
            done: function () {}
        });
      }
      current_image = idx;
    }

    timeline.on('set-range', function (args) {
      filtered = data.filter(function (d) {
        return (args.start <= d.date) & (d.date <= args.end);
      });
      sorted = filtered.sort(function (a, b) { return a.date - b.date });
      if (sorted.length == 0) {
        set_current(-1);
      } else {
        set_current(sorted[sorted.length-1].idx);
      }
      lines.map(function (line) {
          if ((line.startDate > args.end) | (line.endDate < args.start)) {
              line.setStyle(lineStyleHidden);
          } else {
              line.setStyle(lineStyle);
          }
      });
    });

    $(document).ready(function() {
      $('.image').bind('mousewheel', function(e) {
        if (e.originalEvent.wheelDelta / 120 > 0) {
          forward = true;
          var current_date = data[current_image].date;
          filtered = data.filter(function (d) {
            return current_date < d.date;
          });
          sorted = filtered.sort(function (a, b) { return a.date - b.date });
          if (sorted.length) {
              timeline.setRange(new Date(sorted[0].date - (current_date - timeline.windowStart)), sorted[0].date);
          }
        } else{
          forward = false;
          var current_date = data[current_image].date;
          filtered = data.filter(function (d) {
            return current_date > d.date;
          });
          sorted = filtered.sort(function (a, b) { return a.date - b.date });
          if (sorted.length) {
              timeline.setRange(new Date(sorted[sorted.length - 1].date - (current_date - timeline.windowStart)), sorted[sorted.length - 1].date);
          }
        }
      });
    });

    map.on('click', function(evt) {
        var done = false;
        map.forEachFeatureAtPixel(
            evt.pixel,
            function(feature) {
                if (done || (feature.idx === undefined)) return;
                timeline.setRange(new Date(data[feature.idx].date - (timeline.windowEnd - timeline.windowStart)), data[feature.idx].date);
                done = true;
            }
        );
    });
      
    timeline.startup();

  });
});
