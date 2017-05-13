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

        vm.gridOptions = {
            data: [],
            getData: vm.getServerData
        };

        vm.scvHeader = [
            'created',
            'email',
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

        getProfiles()
            .then(function (resp) {
                vm.profileOptions = resp.data;
                vm.statusOptions = [
                    {
                        name: "new"
                    },
                    {
                        name: "new clear"
                    },
                    {
                        name: "unapproved"
                    },
                    {
                        name: "disapproved"
                    },
                    {
                        name: "approved"
                    }
                ]
            });


        function disableEditMode() {
            window.location.reload();
        }

        function saveChanges() {
            saveData(vm.sortedData);
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
            return $http.get('/front/rest/sotka')
        }
        
        function exportCSV() {
            return vm.sortedData.map(function(item) {
                return {
                    created: item.created,
                    email: item.email,
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
                }
            });
        }

        function getFileName() {
            return $filter('date')(Date.now(), "yyyy-MM-dd_HH:mm:ss") + '-pupil-list.csv';
        }
    }

})();