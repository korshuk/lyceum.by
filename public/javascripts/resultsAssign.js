(function () {
    'use strict';
    angular
        .module('assignApp', ['ui.bootstrap', 'angular-loading-bar', 'oi.select'])
        .directive('autoFocus', autoFocus)
        .filter('pupilsFilter', pupilsFilter)
        .controller('assignController', assignController);

    autoFocus.$ingect = ['$timeout'];
    assignController.$ingect = ['$http', '$filter'];

    function assignController($http, $filter) {
        var vm = this;


        vm.pupils = [];
        vm.results = [];
        vm.tempPupil = {};
        vm.pupilsCount ;
        vm.resultsCount;
        vm.olympPupilsCoumt = 0;

        vm.showresultInput = showresultInput;
        vm.onResultInputChange = onResultInputChange;
        vm.clearResult = clearResult;
        vm.addAbsence = addAbsence;
        vm.removeAbsence = removeAbsence;

        vm.saveChanges = saveChanges;
        vm.calculate = calculate;


        vm.examStatuses = {
            0: 'ok',
            1: 'неявка',
            2: 'плохой',
            3: 'хороший',
            4: 'температура'
        };

        getProfile();
        getResultsData().then(getPupilsData)


        function addAbsence(pupil) {
            pupil[`exam${EXUM_NUMBER}`] = -2;
        }

        function removeAbsence(pupil) {
            pupil[`exam${EXUM_NUMBER}`] = undefined;
        }

        function clearResult(result) {
            for (var i = 0; i < vm.pupils.length; i++) {
                if (vm.pupils[i]._id === result.selectedPupil._id) {
                    vm.pupils[i].result = undefined;
                    break;
                }
            }
            result.selectedPupil = undefined;
        }    

        function onResultInputChange(result, tempPupil) {
            for (var i = 0; i < vm.pupils.length; i++) {
                if (vm.pupils[i]._id === tempPupil._id) {
                    vm.pupils[i].result = result._id;
                    break;
                }
            }
            for (var j = 0; j < vm.results.length; j++) {
                if (vm.results[j].selectedPupil && vm.results[j].selectedPupil._id === tempPupil._id) {
                    vm.results[j].selectedPupil = {};
                    break;
                }
            }  
            result.selectedPupil = tempPupil;
            result.isEditable = false;
        }   

        function showresultInput(result) {
            if (!result.isEditable) {
                vm.tempPupil = {};
            }
            for(var i = 0; i < vm.results.length; i++) {
                vm.results[i].isEditable = false; 
            }
            result.isEditable = true;
        }

        function calculate() {
            $http.get('/admin/settings/api/calculateStats')
                .then(getProfile)
                .catch(function(err){
                    console.log(err);
                    alert('Беда!!!! что-то сломалось');
                });
        }    

        function saveChanges() {
            saveData(vm.pupils.map(minimizePupil));
        }

        function minimizePupil(pupil) {
            var obj = {}
            obj._id = pupil._id;
            obj.result = pupil.result;
            obj[`exam${EXUM_NUMBER}`] = pupil[`exam${EXUM_NUMBER}`];
            return obj;
        }

        function saveData(data) {
            console.log('save', data)
            $http
                .post(`/admin/pupils/api/listNew/${EXUM_NUMBER}`, data)
                .then(function (response) {
                    alert('Всё сохранилось!!!');
                    getResultsData().then(getPupilsData);
                })
                .catch(function (err) {
                    console.log(err);
                    alert('Беда!!!! что-то сломалось');
                });
        }

        function getPupilsData() {
            var params = `?page=1&itemsPerPage=1000&sort=firstName-asc&profile=${PROFILE_ID}&status=approved`;
            
            return $http
                .get('/admin/pupils/api/list' + params)
                .then(function (response) {
                    var data = response.data;
                    vm.pupils = data.pupils;
                    vm.pupilsCount = 0;
                    vm.pupils.forEach(pupil => {
                        pupil.fio = `${pupil.firstName} ${pupil.lastName} ${pupil.parentName}`
                        for (var i = 0; i < vm.results.length; i++) {
                            if (pupil[`result${EXUM_NUMBER}`] && vm.results[i]._id === pupil[`result${EXUM_NUMBER}`]._id) {
                                pupil.result = vm.results[i]._id;
                                vm.results[i].selectedPupil = pupil;
                                break;
                            }
                        }
                        if (pupil.passOlymp) {
                            vm.olympPupilsCoumt += 1;
                        }
                    })
                    console.log(vm.pupils)
                    vm.pupilsCount = data.count;
                    return data
                })
                .catch(function (err) {
                    console.log(err);
                });
        }

        function getResultsData() {
            return $http
                .get(`/admin/pupils/profiles/results/api/assign/${PROFILE_ID}/${EXUM_NUMBER}`)
                .then(function (response) {
                    var data = response.data;
                    vm.results = data;
                    vm.resultsCount = data.length || 0
                    return data
                })
                .catch(function (err) {
                    console.log(err);
                });
        }

        function getProfile() {
            return $http
                .get('/front/rest/sotka')
                .then(function(res) {
                    var profiles = res.data;
                    var profile;
                    for (var i = 0; i < profiles.length; i++) {
                        if (profiles[i]._id === PROFILE_ID) {
                            profile = profiles[i];
                            break;
                        }
                    }
                    vm.profile = profile;
                });
        }
        
    }

    function autoFocus($timeout) {
        return {
            link: function (scope, element, attrs) {
                attrs.$observe("autoFocus", function(newValue){
                    if (newValue === "true")
                        $timeout(function(){element[0].children[0].firstElementChild.firstElementChild.firstElementChild.focus()});
                });
            }
        };
    }

    function pupilsFilter() {
        return function(pupils) {
            return pupils.filter(pupil => !pupil.passOlymp && pupil[`exam${EXUM_NUMBER}`] !== -2)
        }
    }

})();