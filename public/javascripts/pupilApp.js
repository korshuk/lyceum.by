(function () {
    'use strict';
    angular
        .module('pupilApp', ['ui.bootstrap', 'dataGrid', 'pagination', 'angular-loading-bar'])
        .controller('pupilController', pupilController);

    pupilController.$ingect = ['$http', '$location'];

    function pupilController($http, $location) {
        var vm = this;

        vm.getServerData = getServerData;
        vm.location = $location;

        vm.gridOptions = {
            data: [],
            getData: vm.getServerData
        };

        vm.gridActions = {};

        function getServerData(params, callback) {
            $http
                .get('/admin/pupils/api/list' + params)
                .then(function (response) {
                    console.log(response);
                    var data = response.data.pupils,
                        totalItems = response.data.count;
                    callback(data, totalItems);
                })
                .catch(function (err) {
                    console.log(err);
                });
        }
    }

})();