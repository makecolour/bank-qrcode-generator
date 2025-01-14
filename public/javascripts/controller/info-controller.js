app.controller('info-controller', ['$scope', '$http', '$sce', 'bankService', function($scope, $http, $sce, bankService) {
    $scope.qrData = {
        service_code: 'account',
        currency: 'VND',
        text_color: '#000000',
        text_background: '#ffffff',
        footer_color: '#000000',
    };
    $scope.qrResult = null;
    $scope.qrType = '';
    $scope.error = '';
    $scope.banks = [];
    $scope.services = [
        { code: 'account', name: 'Bank to account' },
        { code: 'card', name: 'Bank to card' }
    ];
    $scope.currency = [
        { code: 'VND', name: 'Vietnamese Dong' },
        { code: 'USD', name: 'US Dollar' },
    ]
    $scope.errorCorrectionLevels = [
        { code: 'L', name: 'Low' },
        { code: 'M', name: 'Medium' },
        { code: 'Q', name: 'Quartile' },
        { code: 'H', name: 'High' }
    ];

    $scope.isLoading = false;

    bankService.fetchBanks().then(function(banks) {
        $scope.banks = banks;
    }).catch(function(error) {
        console.error('Error fetching banks:', error);
    });

    $scope.generateQR = function(type) {
        $scope.error = '';
        const url = 'api/qr-png-with-info';
        $scope.isLoading = true;
        $http.get(url, { params: $scope.qrData })
            .then(function(response) {
                if(response.data.status === 'success') {
                    $scope.type = type;
                    $scope.qrResult = response.data.data;
                }
                $scope.isLoading = false;
            })
            .catch(function(error) {
                console.error('Error generating QR code:', error);
                $scope.error = 'Error generating QR code: ' + error.data;
                $scope.isLoading = false;
            });
    };
}]);