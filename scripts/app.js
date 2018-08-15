(function () {
    'use strict';

    var app = {
        isLoading: true,
        visibleCards: {},
        selectedTimetables: [],
        spinner: document.querySelector('.loader'),
        cardTemplate: document.querySelector('.cardTemplate'),
        container: document.querySelector('.main'),
        addDialog: document.querySelector('.dialog-container'),
        indexedDB: window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB,
        iDBTransaction: window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction,
        iDBKeyRange: window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange,
        useIndexedDB: true
    };

    /*****************************************************************************
     *
     * Event listeners for UI elements
     *
     ****************************************************************************/

    document.getElementById('butRefresh').addEventListener('click', function () {
        // Refresh all of the metro stations
        app.updateSchedules();
    });

    document.getElementById('butAdd').addEventListener('click', function () {
        // Open/show the add new station dialog
        app.toggleAddDialog(true);
    });

    document.getElementById('butAddCity').addEventListener('click', function () {
        var select = document.getElementById('selectTimetableToAdd');
        var selected = select.options[select.selectedIndex];
        var key = selected.value;
        var label = selected.textContent;
        if (!app.selectedTimetables) {
            app.selectedTimetables = [];
        }
        app.getSchedule(key, label);
        app.selectedTimetables.push({key: key, label: label});

        // Se guardan las estaciones seleccionadas en el localStorage
        app.saveSelectedTimetables();
        console.log("Estacion [" + label + "] almacenada en el localStorage");
        app.toggleAddDialog(false);
    });

    document.getElementById('butAddCancel').addEventListener('click', function () {
        // Close the add new station dialog
        app.toggleAddDialog(false);
    });

    /*****************************************************************************
     *
     * Methods to update/refresh the UI
     *
     ****************************************************************************/

    // Toggles the visibility of the add new station dialog.
    app.toggleAddDialog = function (visible) {
        if (visible) {
            app.addDialog.classList.add('dialog-container--visible');
        } else {
            app.addDialog.classList.remove('dialog-container--visible');
        }
    };

    // Updates a timestation card with the latest weather forecast. If the card
    // doesn't already exist, it's cloned from the template.

    app.updateTimetableCard = function (data) {
        var key = data.key;
        var dataLastUpdated = new Date(data.created);
        var schedules = data.schedules;
        var card = app.visibleCards[key];

        if (!card) {
            var label = data.label.split(', ');
            var title = label[0];
            var subtitle = label[1];
            card = app.cardTemplate.cloneNode(true);
            card.classList.remove('cardTemplate');
            card.querySelector('.label').textContent = title;
            card.querySelector('.subtitle').textContent = subtitle;
            card.removeAttribute('hidden');
            app.container.appendChild(card);
            app.visibleCards[key] = card;
        }
        else {
          var cardLastUpdatedElem = card.querySelector('.card-last-updated');
          var cardLastUpdated = cardLastUpdatedElem.textContent;
          if (cardLastUpdated) {
            cardLastUpdated = new Date(cardLastUpdated);
            // Bail if the card has more recent data then the data
            if (dataLastUpdated.getTime() < cardLastUpdated.getTime()) {
              return;
            }
          }
        }
        card.querySelector('.card-last-updated').textContent = data.created;

        var scheduleUIs = card.querySelectorAll('.schedule');
        for(var i = 0; i<4; i++) {
            var schedule = schedules[i];
            var scheduleUI = scheduleUIs[i];
            if(schedule && scheduleUI) {
                scheduleUI.querySelector('.message').textContent = schedule.message;
            }
        }

        if (app.isLoading) {
            app.spinner.setAttribute('hidden', true);
            app.container.removeAttribute('hidden');
            app.isLoading = false;
        }
    };

    /*****************************************************************************
     *
     * Methods for dealing with the model
     *
     ****************************************************************************/

     // Save list of cities to localStorage
     app.saveSelectedTimetables = function() {
       var selectedTimetables = JSON.stringify(app.selectedTimetables);

       if(!app.useIndexedDB) {
          localStorage.selectedTimetables = selectedTimetables;
       }
       else {
          var dataBase = app.indexedDB.open("rarpdb", 3);
          dataBase.onerror = function(event) {
              app.useIndexedDB = false;
          };

          dataBase.onsuccess = function(event) {
              var db = event.target.result;

              var tx = db.transaction(["timetables"], "readwrite");
              // Close the db when the transaction is done
              tx.oncomplete = function() {
                  db.close();
              };
              var store = tx.objectStore("timetables");

              var request = store.get("selected");
              request.onsuccess = function(event) {
                  if(request.result == null)
                      store.add({id: "selected", value: selectedTimetables});
                  else {
                      var data = request.result;
                      data.value = selectedTimetables;
                      store.put(data);
                  }
              };
          };
       }
     };

     app.getSchedule = function (key, label) {
        var url = 'https://api-ratp.pierre-grimaud.fr/v3/schedules/' + key;

        // Recuperar los horarios de la caché
        if ('caches' in window) {
          caches.match(url).then(function(response) {
            if (response) {
              response.json().then(function updateFromCache(json) {
                var result = {};
                result.key = key;
                result.label = label;
                result.created = json._metadata.date;
                result.schedules = json.result.schedules;
                app.updateTimetableCard(result);
              });
            }
          });
        }

        var request = new XMLHttpRequest();
        request.onreadystatechange = function () {
            if (request.readyState === XMLHttpRequest.DONE) {
                if (request.status === 200) {
                    var response = JSON.parse(request.response);
                    var result = {};
                    result.key = key;
                    result.label = label;
                    result.created = response._metadata.date;
                    result.schedules = response.result.schedules;
                    app.updateTimetableCard(result);
                }
            } else {
                app.updateTimetableCard(initialStationTimetable);
            }
        };
        request.open('GET', url);
        request.send();
    };

    // Iterate all of the cards and attempt to get the latest timetable data
    app.updateSchedules = function () {
        var keys = Object.keys(app.visibleCards);
        keys.forEach(function (key) {
            app.getSchedule(key);
        });
    };

    app.loadDefault = function () {
        app.updateTimetableCard(initialStationTimetable);
        app.selectedTimetables = [
          {key: initialStationTimetable.key, label: initialStationTimetable.label}
        ];
        app.saveSelectedTimetables();
        console.log('DATOS POR DEFECTO CARGADOS!!!');
    }

    /*
     * Fake timetable data that is presented when the user first uses the app,
     * or when the user has not saved any stations. See startup code for more
     * discussion.
     */

    var initialStationTimetable = {
        key: 'metros/1/bastille/A',
        label: 'Bastille, Direction La Défense',
        created: '2018-08-16T17:08:42+02:00',
        schedules: [
            {
                message: '30 mn'
            },
            {
                message: '40 mn'
            },
            {
                message: '50 mn'
            }
        ]
    };

    // Inicialización de IndexedDB
    if(window.indexedDB) {
      // Open (or create) the database
      var dataBase = app.indexedDB.open("rarpdb", 3);

      dataBase.onerror = function(event) {
         app.useIndexedDB = false;
         console.log('Error cargando la base de datos.');
      };

      dataBase.onsuccess = function(event) {
         console.log('Base de datos cargada correctamente.');
      };

      // Create the schema
      dataBase.onupgradeneeded = function(event) {
          var db = event.target.result;
          db.createObjectStore("timetables", {keyPath: "id"});
      };
    }
    else {
      app.useIndexedDB = false;
    }


    /*
      Inyección datos primer reload (PASO 1).
      Se identifica que es el PRIMER CARGUE porque no hay estaciones
      seleccionadas, es decir, guardadas en el localStorage, por tanto se
      cargan datos por defecto.
    */
    if(!app.useIndexedDB) {
      console.log('Carga info del localStorage.');
      app.selectedTimetables = localStorage.selectedTimetables;

      if (app.selectedTimetables) {
          app.selectedTimetables = JSON.parse(app.selectedTimetables);
          app.selectedTimetables.forEach(function(sch) {
            app.getSchedule(sch.key, sch.label);
          });
      } else {
          app.loadDefault();
      }
    }
    else {
      var dataBase = app.indexedDB.open("rarpdb", 3);
      dataBase.onerror = function(event) {
          app.useIndexedDB = false;
      };

      dataBase.onsuccess = function(event) {
          var db = event.target.result;
          var tx = db.transaction(["timetables"], "readwrite");

          // Close the db when the transaction is done
          tx.oncomplete = function() {
              if(app.selectedTimetables.length == 0) {
                app.loadDefault();
              }
              db.close();
          };
          var store = tx.objectStore("timetables");
          var request = store.get("selected");

          request.onsuccess = function(event) {
              if(request.result != null) {
                  app.selectedTimetables = JSON.parse(request.result.value);
                  app.selectedTimetables.forEach(function(sch) {
                      app.getSchedule(sch.key, sch.label);
                  });
              }
          };
      };
    }

    // Registro del ServiceWorker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker
               .register('./service-worker.js')
               .then(function() { console.log('Service Worker Registered'); });
    }
})();
