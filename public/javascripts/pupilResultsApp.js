(function () {
    'use strict';
    angular
        .module('pupilApp', ['ui.bootstrap', 'dataGrid', 'pagination', 'angular-loading-bar', 'ngCsv'])
        .controller('pupilController', pupilController);

    pupilController.$ingect = ['$http', '$location', '$filter'];

    function pupilController($http, $location, $filter) {
        var vm = this;

        vm.getServerData = getServerData;
        vm.location = $location;

        vm.exportCSV = exportCSV;
        vm.getFileName = getFileName;
        vm.disableEditMode = disableEditMode;
        vm.saveChanges = saveChanges;
        vm.calculate = calculate;
        vm.getProfile = getProfile;

        vm.gridOptions = {
            data: [],
            urlSync: true,
            getData: vm.getServerData
        };

        vm.scvHeader = [
            'created',
            'email',
            'phone',
            'firstName',
            'lastName',
            'parentName',
            'distant',
            'night',
            'passOlymp',
            'profileName',
            'region',
            'status',
            'needBel',
            'exam1',
            'exam2',
            'sum'
        ];

        vm.examStatuses = {
            0: 'ok',
            1: 'неявка',
            2: 'плохой',
            3: 'хороший',
            4: 'температура'
        };


        getProfiles()
            .then(function (resp) {
                vm.profileOptions = resp.data;
            });

        function getProfile(id) {
            var profile = [{}];

            if (vm.profileOptions && vm.profileOptions.length > 0) {
                profile = vm.profileOptions.filter(function(profile){
                    return profile._id === id;
                }); 
            }
            return profile[0];
        }

        function calculate() {
            $http.get('/admin/sotka/subjects/renew')
                .then(function() {
                    getProfiles()
                        .then(function (resp) {
                            vm.profileOptions = resp.data;
                        });
                })

                .catch(function(err){
                    console.log(err);
                    alert('Беда!!!! что-то сломалось');
                });
        }    

        function disableEditMode() {
            window.location.reload();
        }

        function saveChanges() {
            saveData(vm.sortedData.map(minimizePupil));
        }

        function minimizePupil(pupil) {
            var exam1 = Number.parseInt(pupil.exam1);
            var exam2 = Number.parseInt(pupil.exam2);

            if (isNaN(exam1) && pupil.exam1 && pupil.exam1.length > 0) {
                exam1 = -2;
            }
            if (isNaN(exam2) && pupil.exam2 && pupil.exam2.length > 0) {
                exam2 = -2;
            }

            return {
                _id: pupil._id,
                exam1: exam1,
                exam2: exam2
            };
        }

        function saveData(data) {
            $http
                .post('/admin/pupils/api/list', data)
                .then(function (response) {
                    disableEditMode();
                })
                .catch(function (err) {
                    console.log(err);
                    alert('Беда!!!! что-то сломалось');
                });
        }
        function getServerData(params, callback) {
            if (params.indexOf('status=') < 0) {
                params = params + '&status=approved';
            }
            $http
                .get('/admin/pupils/api/list' + params)
                .then(function (response) {
                    console.log(response);
                    var data = response.data.pupils,
                        totalItems = response.data.count;
                    vm.sortedData = data;
                    callback(data, totalItems);
                })
                .catch(function (err) {
                    console.log(err);
                });
        }

        function getProfiles() {
            return $http.get('/front/rest/sotka');
        }
        
        function exportCSV() {
            return vm.sortedData.map(function(item) {
                return {
                    created: item.created,
                    email: item.email,
                    phone: item.phone,
                    firstName: item.firstName,
                    lastName: item.lastName,
                    parentName: item.parentName,
                    distant: item.distant,
                    night: item.night,
                    passOlymp: item.passOlymp,
                    profileName: item.profile ? item.profile.name : '',
                    region: item.region,
                    status: item.status,
                    needBel: item.needBel,
                    exam1: item.exam1,
                    exam2: item.exam2,
                    sum: item.sum
                };
            });
        }

        function getFileName() {
            return $filter('date')(Date.now(), 'yyyy-MM-dd_HH:mm:ss') + '-pupil-list.csv';
        }
    }

})();