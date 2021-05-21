'use strict';
const EXAM_REPORT_TYPE = 1,
      STATS_REPORT_TYPE = 2,
      ALL_STATS_REPORT_TYPE = 3;

const EXAM_NUMBER_NAMES = {
        1: 'first', 
        2: 'second'
    };

var templateControllers = angular.module('templateControllers', []);

templateControllers.factory('dataService', dataService);

templateControllers.controller('listController', listController);

templateControllers.controller('template1Controller', template1Controller);

templateControllers.controller('template2Controller', template2Controller);

templateControllers.controller('template3Controller', template3Controller);

templateControllers.$ingect = ['dataService', '$filter'];
dataService.$ingect = ['$http'];

function template1Controller(dataService, $filter) {
    var vm = this;

    vm.dateOptions = {
        dateDisabled: false,
        formatYear: 'yy',
        maxDate: new Date(2020, 5, 22),
        minDate: new Date(),
        startingDay: 1
    };
    vm.datePopup = {};
    vm.entranceTestForm = {};
    vm.data = {
        type: EXAM_REPORT_TYPE,
        testVariant: 'Вариант А и Вариант В', 
        showPlaces: true  
    };
    
    vm.map;

    vm.onProfileChange = onProfileChange;
    vm.onFormSubmit = onFormSubmit;
    vm.openDatePopup = openDatePopup;

    setDefaultTimes();
    dataService.getStats().then(onSubjectsSuccess)

    function setDefaultTimes() {
        var startD = new Date();
        var endD = new Date();
        startD.setHours( 9 );
        startD.setMinutes( 0 );
        endD.setHours( 12 );
        endD.setMinutes( 0 );

        vm.data.startTime = startD;
        vm.data.endTime = endD;
    }
    function openDatePopup() {
        vm.datePopup.opened = true;
    };

    function onProfileChange(selectedProfile) {
        vm.subjects = vm.map[selectedProfile];
    }

    function onFormSubmit() {
        vm.entranceTestForm.$submitted = true;
        if (vm.entranceTestForm.$valid) {
            var url = `/admin/report/show/${vm.data.type}?`;
            var props = {};
            var currentSubject;

            for (var i = 0; i < vm.subjects.length; i++) {
                if (vm.subjects[i]._id == vm.data.subject) {
                    currentSubject = vm.subjects[i];
                }
            }
            props.subjectId = vm.data.subject;
            props.subjectName = currentSubject.name;
            props.date = currentSubject.date;
            props.startTimeString =  $filter('date')(vm.data.startTime, "HH часов mm минут");
            props.endTimeString =  $filter('date')(vm.data.endTime, "HH часов mm минут");
            props.testVariant = vm.data.testVariant;
            props.entryDate = vm.data.entryDate;
            props.showPlaces = vm.data.showPlaces;
            console.log(props, queryStringFromObj(props), url + queryStringFromObj(props));

            openInNewTab(url + queryStringFromObj(props))

            
            
            /*dataService.postData(vm.data).then(function (res) {
                if (res.data.id) {
                    window.location = '/admin/report/generated/' + res.data.id;
                }
            })*/
        }
    }

    function onSubjectsSuccess(resp) {
        vm.subjects = resp.data;
    }
}


function template2Controller(dataService, $filter) {
    var vm = this;
    vm.barOptions = [0,1,2,3,4,5,6,7,8,9];
    vm.dateOptions = {
        dateDisabled: false,
        formatYear: 'yy',
        maxDate: new Date(2020, 5, 22),
        minDate: new Date(),
        startingDay: 1
    };
    vm.datePopup = {};
    vm.statsForm = {};
    vm.data = {
        type: STATS_REPORT_TYPE,
        barNum: '4',
        barToEndNum: '5'
    };
    
    vm.map;

    vm.onProfileChange = onProfileChange;
    vm.onFormSubmit = onFormSubmit;
    vm.openDatePopup = openDatePopup;

    dataService.getStats().then(onSubjectsSuccess)

    function openDatePopup() {
        vm.datePopup.opened = true;
    };

    function onProfileChange(selectedProfile) {
        vm.subjects = vm.map[selectedProfile];
    }

    function onFormSubmit() {
        vm.statsForm.$submitted = true;
        if (vm.statsForm.$valid) {
            var url = `/admin/report/show/${vm.data.type}?`;
            var props = {};

            var currentSubject;

            for (var i = 0; i < vm.subjects.length; i++) {
                if (vm.subjects[i]._id == vm.data.subject) {
                    currentSubject = vm.subjects[i];
                }
            }
            
            props.subjectId = vm.data.subject;
            props.subjectName = currentSubject.name;
            props.date = currentSubject.date;
            props.barNum = vm.data.barNum;
            props.barToEndNum = vm.data.barToEndNum;
            props.subject = vm.data.subject;
            props.entryDate = vm.data.entryDate;

            openInNewTab(url + queryStringFromObj(props))
            
            
            /*dataService.postData(vm.data).then(function (res) {
                if (res.data.id) {
                    window.location = '/admin/report/generated/' + res.data.id;
                }
            })*/
        }
    }

    function onSubjectsSuccess(resp) {
        vm.subjects = resp.data;
    }

}

function template3Controller(dataService, $filter) {
    var vm = this;
    vm.barOptions = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19];
    vm.dateOptions = {
        dateDisabled: false,
        formatYear: 'yy',
        maxDate: new Date(2020, 5, 22),
        minDate: new Date(),
        startingDay: 1
    };
    vm.datePopup = {};
    vm.statsForm = {};
    vm.data = {
        type: ALL_STATS_REPORT_TYPE,
        barNum: '9',
        barToEndNum: '10'
    };
    
    vm.map;
    vm.onProfileChange = onProfileChange;
    vm.onFormSubmit = onFormSubmit;
    vm.openDatePopup = openDatePopup;

    dataService.getStats().then(getProfilesToSubjectMap)

    function openDatePopup() {
        vm.datePopup.opened = true;
    };

    function onProfileChange(selectedProfile) {
        vm.subjects = vm.map[selectedProfile];
        for (var i = 0; i < vm.profiles.length; i++) {
            if (vm.profiles[i].name === selectedProfile) {
                vm.selectedProfile = vm.profiles[i];
            }
        }
    }

    function onFormSubmit() {
        vm.statsForm.$submitted = true;
        if (vm.statsForm.$valid) {
            var url = `/admin/report/show/${vm.data.type}?`;
            var props = {};
            var currentProfile;
            for (var i = 0; i < vm.profiles.length; i++) {
                if (vm.profiles[i].name == vm.data.profile) {
                    currentProfile = vm.profiles[i];
                }
            }
            props.barNum = vm.data.barNum;
            props.barToEndNum = vm.data.barToEndNum;
            props.profile = currentProfile.name;
            props.profileId = currentProfile._id;
            props.entryDate = vm.data.entryDate;

            openInNewTab(url + queryStringFromObj(props))
        }
    }

    function getProfilesToSubjectMap(resp) {
        vm.map = {};
        vm.profiles = resp.data;
        for (var i = 0; i < vm.profiles.length; i++) {
            vm.map[vm.profiles[i].name] = [vm.profiles[i].firstExamName, vm.profiles[i].secondExamName]
        };
    }

}


function listController() {
    console.log('list');
}

function dataService($http) {
    return {
        postData: postData,
        getStats: getStats
    }

    function postData(data) {
        return $http.post(`/admin/report/generate/${data.type}`, data);
    }

    function getStats() {
        return $http.get('/admin/rest/reports/subjects');
    }
}

function openInNewTab(url) {
    var win = window.open(url, '_blank');
    win.focus();
  }

function queryStringFromObj(params) {
    return Object.keys(params).map(function(key) {
        return key + '=' + params[key]
    }).join('&');
}  