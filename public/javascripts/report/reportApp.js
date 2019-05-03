'use strict';

var reportApp = angular.module('reportApp', ['ui.router','templateControllers']);

reportApp.config(function($stateProvider) {
    var report1 = {
        name: 'report1',
        url: '/report1',
        templateUrl: '/templates/report-template1.html',
        controller: 'template1Controller',
        controllerAs: 'app'
    };

    var report2 = {
        name: 'report2',
        url: '/report2',
        templateUrl: '/templates/report-template2.html',
        controller: 'template2Controller',
        controllerAs: 'app'
    };

    $stateProvider.state(report1);
    $stateProvider.state(report2);
});