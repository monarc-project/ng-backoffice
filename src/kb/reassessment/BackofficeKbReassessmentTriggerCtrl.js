(function () {

  angular
    .module('BackofficeApp')
    .controller('BackofficeKbReassessmentTriggerCtrl', [
      '$scope', '$rootScope', '$mdDialog', 'toastr', 'gettextCatalog', 'TableHelperService',
      'ReassessmentTriggerService', 'UserService', BackofficeKbReassessmentTriggerCtrl
    ]);

  function BackofficeKbReassessmentTriggerCtrl(
    $scope,
    $rootScope,
    $mdDialog,
    toastr,
    gettextCatalog,
    TableHelperService,
    ReassessmentTriggerService,
    UserService
  ) {
    $scope.userLanguage = UserService.getDataLanguage();
    $scope.reassessmentTriggersKb = TableHelperService.build('triggerType', 20, 1, '');
    $scope.reassessmentTriggersKb.activeFilter = 1;

    $scope.updateReassessmentTriggers = function () {
      var query = angular.copy($scope.reassessmentTriggersKb.query);
      query.status = $scope.reassessmentTriggersKb.activeFilter;

      if ($scope.reassessmentTriggersKb.previousQueryOrder != $scope.reassessmentTriggersKb.query.order) {
        $scope.reassessmentTriggersKb.query.page = query.page = 1;
        $scope.reassessmentTriggersKb.previousQueryOrder = $scope.reassessmentTriggersKb.query.order;
      }

      $scope.reassessmentTriggersKb.promise = ReassessmentTriggerService.getReassessmentTriggers(query);
      $scope.reassessmentTriggersKb.promise.then(function (data) {
        $scope.reassessmentTriggersKb.items = data;
      });
    };

    var reassessmentTriggersFilterWatch = $scope.$watch('reassessmentTriggersKb.activeFilter', function (newValue, oldValue) {
      if (newValue === oldValue) {
        return;
      }

      $scope.reassessmentTriggersKb.query.page = 1;
      $scope.updateReassessmentTriggers();
    });

    var reassessmentTriggersLanguageWatch = $rootScope.$on('languageChanged', function () {
      $scope.updateReassessmentTriggers();
    });

    TableHelperService.watchSearch(
      $scope,
      'reassessmentTriggersKb.query.filter',
      $scope.reassessmentTriggersKb.query,
      $scope.updateReassessmentTriggers,
      $scope.reassessmentTriggersKb
    );

    $scope.$on('$destroy', function () {
      reassessmentTriggersFilterWatch();
      reassessmentTriggersLanguageWatch();
      TableHelperService.unwatchSearch($scope.reassessmentTriggersKb);
    });

    $scope.removeReassessmentTriggersFilter = function () {
      TableHelperService.removeFilter($scope.reassessmentTriggersKb);
    };

    $scope.openReassessmentTriggerDialog = function (ev, reassessmentTrigger) {
      var showDialog = function (reassessmentTriggerData) {
        $mdDialog.show({
          controller: [
            '$scope', '$mdDialog', 'gettextCatalog', '$rootScope', 'reassessmentTrigger',
            ReassessmentTriggerDialogCtrl
          ],
          templateUrl: 'views/create.reassessment_trigger.html',
          clickOutsideToClose: true,
          multiple: true,
          targetEvent: ev,
          locals: {
            reassessmentTrigger: reassessmentTriggerData ? angular.copy(reassessmentTriggerData) : null
          }
        }).then(function (payload) {
          if (reassessmentTrigger) {
            payload.id = reassessmentTrigger.id;
            ReassessmentTriggerService.updateReassessmentTrigger(payload, function () {
              $scope.updateReassessmentTriggers();
              toastr.success(
                gettextCatalog.getString('The reassessment trigger has been edited successfully.'),
                gettextCatalog.getString('Edition successful')
              );
            });
          } else {
            ReassessmentTriggerService.createReassessmentTrigger(payload, function () {
              $scope.updateReassessmentTriggers();
              toastr.success(
                gettextCatalog.getString('The reassessment trigger has been created successfully.'),
                gettextCatalog.getString('Creation successful')
              );
            });
          }
        }, function (reject) {
          $scope.handleRejectionDialog(reject);
        });
      };

      if (reassessmentTrigger) {
        ReassessmentTriggerService.getReassessmentTrigger(reassessmentTrigger.id).then(showDialog);
      } else {
        showDialog(null);
      }
    };

    $scope.toggleReassessmentTriggerStatus = function (reassessmentTrigger) {
      ReassessmentTriggerService.updateReassessmentTrigger({
        id: reassessmentTrigger.id,
        isActive: !reassessmentTrigger.isActive
      }, function () {
        $scope.updateReassessmentTriggers();
      });
    };

    $scope.removeReassessmentTrigger = function (ev, reassessmentTrigger) {
      var confirm = $mdDialog.confirm()
        .title(gettextCatalog.getString('Are you sure you want to delete reassessment trigger?', {
          label: reassessmentTrigger.triggerType
        }))
        .textContent(gettextCatalog.getString('This operation is irreversible.'))
        .targetEvent(ev)
        .theme('light')
        .multiple(true)
        .ok(gettextCatalog.getString('Delete'))
        .cancel(gettextCatalog.getString('Cancel'));

      $mdDialog.show(confirm).then(function () {
        ReassessmentTriggerService.deleteReassessmentTrigger(reassessmentTrigger.id, function () {
          $scope.updateReassessmentTriggers();
          toastr.success(
            gettextCatalog.getString('The reassessment trigger has been deleted.'),
            gettextCatalog.getString('Deletion successful')
          );
        }, function (error) {
          toastr.error(error.data.message, gettextCatalog.getString('Deletion failed'));
        });
      }, function (reject) {
        $scope.handleRejectionDialog(reject);
      });
    };

  }

  function ReassessmentTriggerDialogCtrl($scope, $mdDialog, gettextCatalog, $rootScope, reassessmentTrigger) {
    var currentLanguageCode = gettextCatalog.getCurrentLanguage();

    $scope.dialogTitle = gettextCatalog.getString(
      reassessmentTrigger ? 'Edit reassessment trigger' : 'Add a reassessment trigger'
    );
    $scope.confirmLabel = gettextCatalog.getString(reassessmentTrigger ? 'Save' : 'Create');
    $scope.languages = $rootScope.languages;
    $scope.reassessmentTrigger = reassessmentTrigger || {
      triggerTypes: {},
      descriptions: {},
      monitoringApproaches: {}
    };

    angular.forEach($scope.languages, function (language) {
      if ($scope.reassessmentTrigger.triggerTypes[language.code] === undefined) {
        $scope.reassessmentTrigger.triggerTypes[language.code] = '';
      }
      if ($scope.reassessmentTrigger.descriptions[language.code] === undefined) {
        $scope.reassessmentTrigger.descriptions[language.code] = '';
      }
      if ($scope.reassessmentTrigger.monitoringApproaches[language.code] === undefined) {
        $scope.reassessmentTrigger.monitoringApproaches[language.code] = '';
      }
    });

    $scope.cancel = function () {
      $mdDialog.cancel();
    };

    $scope.getPrimaryValue = function (translations) {
      var primaryValue = ((translations && translations[currentLanguageCode]) || '').trim();
      if (primaryValue) {
        return primaryValue;
      }

      var values = Object.values(translations || {});
      for (var index = 0; index < values.length; index++) {
        var value = (values[index] || '').trim();
        if (value) {
          return value;
        }
      }

      return '';
    };

    $scope.save = function () {
      var triggerTypes = {};
      var descriptions = {};
      var monitoringApproaches = {};

      angular.forEach($scope.languages, function (language) {
        var triggerType = ($scope.reassessmentTrigger.triggerTypes[language.code] || '').trim();
        if (triggerType) {
          triggerTypes[language.code] = triggerType;
        }

        var description = ($scope.reassessmentTrigger.descriptions[language.code] || '').trim();
        if (description) {
          descriptions[language.code] = description;
        }

        var monitoringApproach = ($scope.reassessmentTrigger.monitoringApproaches[language.code] || '').trim();
        if (monitoringApproach) {
          monitoringApproaches[language.code] = monitoringApproach;
        }
      });

      $mdDialog.hide({
        triggerType: $scope.getPrimaryValue($scope.reassessmentTrigger.triggerTypes),
        triggerTypes: triggerTypes,
        description: $scope.getPrimaryValue($scope.reassessmentTrigger.descriptions),
        descriptions: descriptions,
        monitoringApproach: $scope.getPrimaryValue($scope.reassessmentTrigger.monitoringApproaches),
        monitoringApproaches: monitoringApproaches
      });
    };
  }
})();
