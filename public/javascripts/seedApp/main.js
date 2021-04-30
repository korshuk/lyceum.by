(function(){
    'use strict';

    
    angular.module('lyceum', ['lvl.directives.dragdrop', 'cp.ngConfirm']);

    angular
        .module('lyceum')
        .factory('api', apiFactory)
        .controller('seedController', seedController);

    apiFactory.$inject = ['$http'];    

    seedController.$inject = ['api', '$ngConfirm'];

    function apiFactory($http) {
        var API_URL = '/admin/pupils/examseeds/seedApp'
        var EXAM_NUM = window.exumNum;

        var service = {
            getCorpses: getCorpses,
            getSavedCorpses: getSavedCorpses,
            getPupils: getPupils,
            getSavedPupils: getSavedPupils,
            changeAudience: changeAudience,
            getDictionary: getDictionary,
            generate: generate,
            saveSeats: saveSeats,
            savePupilSeats: savePupilSeats,
            saveCurrentSeats: saveCurrentSeats,
            getGenerateStatus: getGenerateStatus
        }

        return service;

        function generate () {
            return $http.get(API_URL + '/api/generate/' + EXAM_NUM)
        }

        function getGenerateStatus () {
            return $http.get(API_URL + '/api/generateStatus/' + EXAM_NUM)
        }

        function saveSeats () {
            return $http.get('/api/saveseats')
        }

        function saveCurrentSeats() {
            var timestemp = Date.now();
            return $http.post(API_URL + '/api/savecurrentseats/' + EXAM_NUM)
        }

        function getCorpses () {
            return $http.get(API_URL + '/api/corpses/' + EXAM_NUM)
        }

        function getSavedCorpses () {
            return $http.get('/api/corpses/saved')
        }

        function getPupils(corps, place) {
            var placeId = place ? place._id : '';
            var url = `${API_URL}/api/pupils/${EXAM_NUM}?corps=${corps.alias}&place=${placeId}`;

            return $http.get(url);
        }

        function getSavedPupils(corps) {
            var url = `/api/pupils/saved?corps=${corps.alias}`;

            return $http.get(url);
        }

        function getDictionary() {
            return $http.get(API_URL + '/api/dictionary')
        }

        function changeAudience(pupilId, audienceId, corps, place) {
            var placeId = place ? place._id : '';
            var url = `${API_URL}/api/changeaudience/${EXAM_NUM}?corps=${corps.alias}&place=${placeId}`;
            
            return $http.post(url, {
                pupilId: pupilId, 
                audienceId: audienceId
            })
        }

        function savePupilSeats(examNum, pupils) {
            var url = `https://lyceum.by/admin/pupils/api/savepupilseats/${examNum}`;
            
            return $http.post(url, pupils) 
        }
    }    
        
    function seedController(api, $ngConfirm) {
        var vm = this;
        console.log('app start 93')
        vm.pupils = [];
        vm.corpses = [];
        vm.dictionary = {};
        vm.currentCorps = {};
        vm.currentPlace = null;
        vm.currentAudience = null;
        vm.cleanDataLoaded = true;
        vm.seatsSaving = false;

        vm.saveSeats = saveSeats;
        vm.loadSeats = loadSeats;
        vm.saveCurrentSeats = saveCurrentSeats;
        vm.generate = generate;

        vm.changeCorps = changeCorps;
        vm.changePlace = changePlace;
        vm.getPupils = getPupils;

        vm.dropped = dropped;
        vm.searchQuery = '';
        vm.pupilFilter = pupilFilter;
        console.log('app start 115')
        api.getDictionary().then(onDictionary);
        api.getCorpses().then(onCorpsesGet);
        api.getGenerateStatus().then(onGenerateStatusGet);

        function generate() {
            api
                .generate()
                .then(onSuccess);

            function onSuccess(res) {
                console.log(res)
                if (res.data.errors) {
                    var errors = res.data.errors;
                    var content = '';
                    for (var i = 0; i < errors.length; i++) {
                        content += `<p>${errors[i].corpsName} ${errors[i].profileName} профиль ${errors[i].belPupilsLength} человек</p>`
                    }
                    $ngConfirm({
                        title: 'Не получается рассадить беларусов',
                        content: content,
                        type: 'red',
                        typeAnimated: true,
                        columnClass: 'large',
                        buttons: {
                            close: function(scope, button){
                                // closes the modal
                            },
                        }
                    });
                } else {
                    window.location = window.location;
                }

            }    
        }

        function loadSeats(examNum) {
            vm.loading = true;
            api.getSavedCorpses()
                .then(function (res) {
                    if (res.data.length === 0) {
                        alert('No saved data')
                    } else {
                        onSavedCorpsLoaded(res.data, examNum);
                    }
                })
        }

        function onSavedCorpsLoaded(corpses, examNum) {
            var corpsesLength = corpses.length,
                counter = 0,
                i = 0;
            for (i; i < corpsesLength; i++) {

                api.getSavedPupils(corpses[i])
                    .then(onPupilsGet)
            }

            function onPupilsGet(res) {
                var pupils = res.data.map(function(p){
                    return {
                        audience: p.audience,
                        _id: p._id,
                        corps: p.corps,
                        place: p.place
                    }
                });
                console.log(examNum, pupils)
                api
                    .savePupilSeats(examNum, pupils)
                    .then(onPupilsSaved)
            }

            function onPupilsSaved(res) {
                counter = counter + 1;
                if (counter === corpsesLength) {
                    vm.loading = false;
                }
                if (res.data !== 'ok') {
                    console.log('Error!', res.data)
                    alert('Error')
                }
            }
        }

        function saveSeats() {
            var win = window.open('/api/saved-seats.json', '_blank');
            win.focus();
        }

        function dropped(dragEl, dropEl) {
            var drag = angular.element(`#${dragEl}`);
            var drop = angular.element(`#${dropEl}`);
        
            var pupilId = drag.attr('data-pupil');
            var audienceId = drop.attr('data-audience');

            var pupilBel = drag.attr('data-bel');
            var audienceBel = drop.attr('data-bel');

            if (pupilBel === audienceBel) {
                api.changeAudience(pupilId, audienceId, vm.currentCorps, vm.currentPlace).then(onAudinceChanged);
            } 
            else {
                if (audienceBel === "true") {
                    alert('Попытка посадить не беларуса к беларусам детектед')
                } else {
                    alert('Попытка посадить беларуса к не беларусам детектед')
                }
               
            }
        }

        function onAudinceChanged(res) {
            vm.pupils = res.data.pupils;
            vm.corpses = res.data.corpses;

            if (vm.currentCorps) {
                for (var i = 0; i < vm.corpses.length; i++) {
                    if (vm.corpses[i].alias === vm.currentCorps.alias) {
                        vm.currentCorps = vm.corpses[i];
                    }
                }
            }

            if (vm.currentPlace) {
                for (var i = 0; i < vm.corpses.length; i++) {
                    for (var j = 0; j < vm.corpses[i].places.length; j++) {
                        if (vm.corpses[i].places[j]._id === vm.currentPlace._id) {
                            vm.currentPlace = vm.corpses[i].places[j];
                        }
                    }
                }
            }

            if (vm.currentPlace) {
                vm.audiences =  vm.currentPlace.audience;
            } else {
                fillAudiencesForCorps();
            }
        }

        function changeCorps() {
            vm.currentPlace = null;
            vm.currentAudience = null;

            getPupils().then(function() {
                fillAudiencesForCorps();
            })
        }

        function changePlace() {        
            vm.currentAudience = null;
            
            if (vm.currentPlace) {
                vm.audiences =  vm.currentPlace.audience;
            } else {
                fillAudiencesForCorps();
            }

        }

        function fillAudiencesForCorps() {
            vm.audiences = [];
            for (var i = 0; i < vm.currentCorps.places.length; i++) {
                vm.audiences = vm.audiences.concat(vm.currentCorps.places[i].audience);
            }

            for (var i = 0; i < vm.audiences.length; i++) {
                console.log(vm.audiences[i])
                vm.audiences[i].count = vm.pupils.filter(function(pupil){
                    return pupil.audience === vm.audiences[i]._id
                }).length
            }
        }

        function getPupils() {
            return api
                .getPupils(vm.currentCorps, vm.currentPlace)
                .then(onPupilsGet);
        }

        function saveCurrentSeats() {
            vm.seatsSaving = true;
            api
                .saveCurrentSeats()
                .then(onCurrentSeatsSaved);
        }

        function onCurrentSeatsSaved(res) {
            vm.seatsSaving = false;
            vm.timestempSaved = timeConverter(res.data.timestemp)
        }

        function onCorpsesGet(res) {
            vm.corpses = res.data;
        }

        function onPupilsGet(res) {
            vm.pupils = res.data;
        }

        function onDictionary(res) {
            vm.dictionary = res.data;
            vm.cleanDataLoaded = JSON.stringify(vm.dictionary.profiles) !== JSON.stringify({})
        }

        function onGenerateStatusGet(res) {
            vm.generated = res.data.generateStatus
            vm.timestemp = timeConverter(res.data.timestemp)
            vm.timestempSaved = timeConverter(res.data.timestempSaved)
        }

        function pupilFilter(pupil) {
            var flag = true;
            if (vm.currentAudience) {
                flag =  pupil.audience === vm.currentAudience._id
            }

            if (flag && vm.searchQuery !== '') {
                flag = pupil.firstName.toLowerCase().indexOf(vm.searchQuery.toLowerCase()) > -1;
            }

            return flag
        }

        function timeConverter(UNIX_timestamp){
            var a = new Date(+UNIX_timestamp);
            var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
            var year = a.getFullYear();
            var month = months[a.getMonth()];
            var date = a.getDate();
            var hour = a.getHours();
            var min = a.getMinutes();
            var sec = a.getSeconds();
            var time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec ;
            return time;
        }
    }    
        
})();