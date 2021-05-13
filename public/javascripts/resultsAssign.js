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
            pupil.resultExamStatus = 1;
        }

        function removeAbsence(pupil) {
            pupil.resultExamStatus = 0;
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
            $http.get('/admin/sotka/subjects/renew')
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
            obj.resultExamStatus = pupil.resultExamStatus;
            // obj[`exam${EXUM_NUMBER}`] = pupil[`exam${EXUM_NUMBER}`];
            return obj;
        }

        function saveData(data) {
            console.log('save', data)
            $http
                .post(`/admin/pupils/api/listNew/${SUBJECT_ID}`, data)
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
            return $http
                .get('/admin/pupils/subjects/results/api/pupils/' + SUBJECT_ID)
                .then(function (response) {
                    var data = response.data;
                    vm.pupilsCount = 0;
                    vm.pupils = []
                    data.pupils.forEach(p => {
                        var pupil = p.pupil;
                        var result;
                        pupil.fio = `${pupil.firstName} ${pupil.lastName} ${pupil.parentName}`;
                        for(var k = 0; k < pupil.results.length; k++) {
                            if (pupil.results[k].exam && pupil.results[k].exam === SUBJECT_ID) {
                                result = pupil.results[k];
                                
                                for (var i = 0; i < vm.results.length; i++) {
                                    if (vm.results[i]._id === result.result) { 
                                        pupil.result = result.result;
                                        vm.results[i].selectedPupil = pupil;
                                    }
                                }
                            }
                        }
                        pupil.resultExamStatus = +result.examStatus || 0;

                        vm.pupils.push(pupil)
                        if (pupil.passOlymp) {
                            vm.olympPupilsCoumt += 1;
                        }
                    })
                    // vm.pupilsCount = data.count;
                    return data
                })
                .catch(function (err) {
                    console.log(err);
                });
        }

        function getResultsData() {
            return $http
                .get(`/admin/pupils/subjects/results/api/assign/${SUBJECT_ID}`)
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
                .get(`/admin/sotka/getSubjectStats/${SUBJECT_ID}`)
                .then(function(res) {
                    var subjectStat = res.data.subjectStat;
                    // var profile;
                    // for (var i = 0; i < profiles.length; i++) {
                    //     if (profiles[i]._id === SUBJECT_ID) {
                    //         profile = profiles[i];
                    //         break;
                    //     }
                    // }
                    vm.subjectStat = subjectStat;
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
            return pupils.filter(pupil => !pupil.passOlymp && pupil.resultExamStatus === 0)
        }
    }

})();