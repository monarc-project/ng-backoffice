(function () {

    angular
        .module('BackofficeApp')
        .controller('BackofficeKbInfoObjectCtrl', [
            '$scope', '$mdToast', '$mdMedia', '$mdDialog', 'gettext', 'gettextCatalog',
            BackofficeKbInfoObjectCtrl
        ]);

    /**
     * BO > KB > INFO > Objects Library > Object details
     */
    function BackofficeKbInfoObjectCtrl($scope, $mdToast, $mdMedia, $mdDialog, gettext, gettextCatalog) {
        $scope.object = {
            id: 25,
            object_category: {
                label1: "Caté Truc",
                label2: null,
                label3: null,
                label4: null,
                position: 1
            },
            asset: {
                label1: 'Objet virtuel d\'information physique',
                label2: null,
                label3: null,
                label4: null,
                description1: 'Objet virtuel qui a des informations en rapport avec quelque chose de physique',
                code: 'OV_INFOPHY',
                status: 1,
                mode: 1,
                type: 2
            },
            source_bdc_object: null,
            rolf_tag: {
                code: 'nouilles',
                label1: 'tagouille',
                label2: null,
                label3: null,
                label4: null
            },
            anr: null,
            type: 3,
            mode: 1,
            scope: 1,
            name1: 'Actes notariés',
            label1: 'Mariage, naissance, reconnaissance, etc.',
            disponibility: 0,
            c: 0,
            i: 0,
            d: 0,
            position: 1
        };

        $scope.composition = [
            {
                id: 30,
                name1: 'Enfant 1'
            },
            {
                id: 31,
                name1: 'Enfant 2',
                children: [
                    {
                        id: 41,
                        name1: 'Sous-enfant 2-1'
                    }
                ]
            },
            {
                id: 32,
                name1: 'Enfant 3'
            }
        ];

        $scope.deleteCompositionItem = function (ev, item) {
            var confirm = $mdDialog.confirm()
                .title(gettext('Detach this component?'))
                .textContent(gettext('The selected component will be detached from the current object.'))
                .ariaLabel(gettext('Detach this component'))
                .targetEvent(ev)
                .ok(gettext('Detach'))
                .cancel(gettext('Cancel'));

            $mdDialog.show(confirm).then(function () {
                // Validated
            }, function () {
                // Cancel
            })
        }
    }
})();