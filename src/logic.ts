/* eslint-disable */
import { isEmpty, isNil, floor, toString } from 'lodash';
import { input, portfolioCompoRequestRepositoryData } from './data';

export interface PortfolioCompoRequest {
    productCode: string,

    portfolioId: number,
    orderVolume: number,

    type: string,


    productId?: number,

    productType?: string,


    totalPrice?: number,

    // requestStatus: PortfolioCompoRequestStatus,

    // requestType: PortfolioCompoRequestType,

    rebalanceId?: number,

    errorCode?: string,

    errorString?: string,

    rightCode?: string,

    // orderMatchStatus: PortfolioPartialSellStatus,

    feeId?: string,

    // orderDate: LocalDateTime,

    totalOrderVolume?: number,

    partnerCode?: string,
    id?: string,

    customerId?: string,

    portfolioCompoId?: number,
}

class portfolioCompoRequestRepository {
    static findByPortfolioIdInAndProductCode(..._arg: (string | number[])[]): PortfolioCompoRequest[] {
        return portfolioCompoRequestRepositoryData
    }
}

interface DetailImportOrderMatchDTO {
    orderType: string; // Loai lenh
    productCode: string; // Ma CK
    volume: number; // So luong
    price: number; // Don gia
    amount?: number; // Thanh tien
    securitiesFee: number; // Phi moi gioi
    securityTax?: number; // Thue chuyen nhuong CK
    netPaymentValue?: number; // Gia tri thanh toan thuan
    sequenceNumer?: number; // So thu tu
    tradingCenter?: string; // So giao dich
}

export interface ImportOrderMatchDTO {
    fileName?: string,
    portfolioIds: number[];
    portfolioId: number,
    //   investor?; // Nha dau tu
    //   partnerCode?; // Ma cong ty CK
    //   custodyAccount?; // So tai khoan luu ky
    //   accounts?; // Tieu khoan
    //   bankName?; // Ten ngan hang luu ky
    // public LocalDate tradingDate; // Ngay giao dich
    // public LocalDate paymentDate; // Ngay thanh toan
    detailOrderMatches: DetailImportOrderMatchDTO[];
}

function funcMapOrderVolumeByPortId(list: PortfolioCompoRequest[]): Record<number, number> {
    const map: any = {}
    // eslint-disable-next-line array-callback-return
    list.map((dto: PortfolioCompoRequest) => {
        map[dto.portfolioId] = (map[dto.portfolioId] ?? 0) + dto.orderVolume
    })
    return map
}


// Luong chia lenh khop vao cac port DMUT
export function splitOrderMatchToPortfolio(listDataDTO: ImportOrderMatchDTO[]) {
    var listOrderMatchDTOs: ImportOrderMatchDTO[] = [];
    listDataDTO.forEach(importOrderMatchDTO => {
        var portfolioIds = importOrderMatchDTO.portfolioIds;
        var detailOrderMatches = importOrderMatchDTO.detailOrderMatches;
        if (isEmpty(portfolioIds)) {
            throw 'Error Empty(portfolioIds)'
        }
        if (portfolioIds.length == 1) {
            importOrderMatchDTO.portfolioId = portfolioIds[0];
            listOrderMatchDTOs.push(importOrderMatchDTO);
            return;
        }
        // Trường hơp có nhiều portfolioId => Tiến hành phân bổ lệnh
        // Tạo 1 HashMap lưu Portfolio và List<DetailImportOrderMatchDTO> tương ứng của port đó sau khi đã phân bổ phiếu lệnh ra các port
        const mapListDetailImportByPortId: Record<number, DetailImportOrderMatchDTO[]> = {}
        // Tạp 1 map lưu phần tử cuối muốn làm tròn của mỗi sản phẩm
        const mapLastElementRound: Record<string, number> = {};

        // var portfolioCompoRequests: PortfolioCompoRequest[] = []
        // var totalOrderVolumeRequest = 0;
        // var productCode = '';

        detailOrderMatches.forEach((detail: DetailImportOrderMatchDTO) => {
            var productCode = detail.productCode;
            var portfolioCompoRequests = portfolioCompoRequestRepository.findByPortfolioIdInAndProductCode(
                portfolioIds,
                productCode,
                // PortfolioCompoRequestType.TRADING_REQUEST,
                // currentDate,
                // nextDate,
                // string.valueOf(detail.getstring()),
                // List.of(PortfolioPartialSellStatus.ORDER_MATCHED),
                // securityService.getRealm()
            );
            var totalOrderVolumeRequest = portfolioCompoRequests.map(e => e.orderVolume).reduce((a, b) => a + b)
            /* Code của Java
            if(
              CollectionUtils.isEmpty(portfolioCompoRequests) || totalOrderVolumeRequest.compareTo(0) == 0
              ) {
            throw BadRequestError.INVEST_PACKAGE_REQ_NOT_EXIST.exception(); // loi phieu lenh khong ton tai
            */

            var portIds = portfolioCompoRequests.map(e => e.portfolioId);
            if (isNil(mapLastElementRound[productCode])) {
                mapLastElementRound[productCode] = portIds.length - 1;
            }

            // var mapOrderVolumeByPortId = portfolioCompoRequests
            //   .stream()
            //   .collect(
            //     Collectors.groupingBy(
            //       PortfolioCompoRequest:: getPortfolioId,
            //       Collectors.collectingAndThen(
            //         Collectors.toList(),
            //         list -> list.stream().map(PortfolioCompoRequest:: getOrderVolume).reduce(number:: add)
            //       )
            //     )
            //   );
            var mapOrderVolumeByPortId = funcMapOrderVolumeByPortId(portfolioCompoRequests);
            // Với mỗi bản ghi khớp lệnh ở detailImportOrderMatchDTO, thực hiện phân bổ lệnh khớp cho các Portfolio tương ứng
            var mapDetailImportByPortId: any = allocateOrderMatchVolume(detail, totalOrderVolumeRequest, mapOrderVolumeByPortId, mapLastElementRound);

            //  Kiểm tra xem mapListDetailImportByPortId có chứa key portfolioId hay không.
            //  Nếu có, thì thêm detailOrderMatch vào list tương ứng của portfolioId.
            //  Nếu không thì tạo một list mới và thêm detailOrderMatch vào
            // mapDetailImportByPortId.forEach((portfolioId, detailOrderMatch) ->
            //   mapListDetailImportByPortId.computeIfAbsent(portfolioId, k -> new ArrayList<>()).add(detailOrderMatch)
            // );

            Object.keys(mapDetailImportByPortId).forEach(portfolioId => {
                var detailOrderMatch = mapDetailImportByPortId[portfolioId];
                Object.keys(mapListDetailImportByPortId).forEach((k: any) => {
                    if (k === portfolioId) mapListDetailImportByPortId[k].push(detailOrderMatch)
                })
            })
        })

        portfolioIds.forEach((portfolioId: number) => {
            var newImportOrderMatchDTO: ImportOrderMatchDTO = {
                portfolioId,
                ...importOrderMatchDTO,
                detailOrderMatches: mapListDetailImportByPortId[portfolioId]
            }
            listOrderMatchDTOs.push(newImportOrderMatchDTO);
        });
    })

    console.log('listOrderMatchDTOs', listOrderMatchDTOs)

    return listOrderMatchDTOs;



    // for (ImportOrderMatchDTO importOrderMatchDTO : listDataDTO) {



    //   // Trường hơp có nhiều portfolioId => Tiến hành phân bổ lệnh
    //   var currentDate = LocalDate.now().atStartOfDay().atZone(ZoneId.systemDefault()).toInstant();
    //   var nextDate = LocalDate.now().plusDays(1).atStartOfDay().atZone(ZoneId.systemDefault()).toInstant();


    // var portIds = portfolioCompoRequests
    //   .stream()
    //   .map(PortfolioCompoRequest:: getPortfolioId)
    //   .collect(Collectors.toSet());
    // if (Objects.isNull(mapLastElementRound.get(productCode))) {
    //   mapLastElementRound.put(productCode, portIds.size() - 1);
    // }
    // var mapOrderVolumeByPortId = portfolioCompoRequests
    //   .stream()
    //   .collect(
    //     Collectors.groupingBy(
    //       PortfolioCompoRequest:: getPortfolioId,
    //       Collectors.collectingAndThen(
    //         Collectors.toList(),
    //         list -> list.stream().map(PortfolioCompoRequest:: getOrderVolume).reduce(number:: add)
    //       )
    //     )
    //   );
    // // Với mỗi bản ghi khớp lệnh ở detailImportOrderMatchDTO, thực hiện phân bổ lệnh khớp cho các Portfolio tương ứng
    // var mapDetailImportByPortId =
    //   this.allocateOrderMatchVolume(detail, totalOrderVolumeRequest, mapOrderVolumeByPortId, mapLastElementRound);
    //  Kiểm tra xem mapListDetailImportByPortId có chứa key portfolioId hay không.
    //  Nếu có, thì thêm detailOrderMatch vào list tương ứng của portfolioId.
    //  Nếu không thì tạo một list mới và thêm detailOrderMatch vào
    //   mapDetailImportByPortId.forEach((portfolioId, detailOrderMatch) ->
    //     mapListDetailImportByPortId.computeIfAbsent(portfolioId, k -> new ArrayList<>()).add(detailOrderMatch)
    //   );
    // });
    // importOrderMatchDTO mới theo khối lượng đã được phân bổ trong phiếu lệnh
    //   portfolioIds.forEach(portId -> {
    //     var newImportOrderMatchDTO = new ImportOrderMatchDTO(
    //       portId,
    //       importOrderMatchDTO,
    //       mapListDetailImportByPortId.get(portId)
    //     );
    //     listOrderMatchDTOs.add(newImportOrderMatchDTO);
    //   });
    // }
    // return listOrderMatchDTOs;
}

function allocateOrderMatchVolume(
    detail: DetailImportOrderMatchDTO,
    totalOrderVolumeRequest: number,
    mapOrderVolumeByPortId: Record<number, number>,
    mapLastElementRound: Record<string, number>
): Record<number, DetailImportOrderMatchDTO> {
    // Map < number, DetailImportOrderMatchDTO > mapDetailImportByPortId = new HashMap<>();
    var mapDetailImportByPortId: Record<number, DetailImportOrderMatchDTO> = {}
    // Chuyển mapOrderVolumeByPortId.entrySet() thành List
    // List < Map.Entry < number, Optional < number >>> entryList = new ArrayList<>(mapOrderVolumeByPortId.entrySet());
    var entryList = Object.keys(mapOrderVolumeByPortId).map(key => ({ key, value: mapOrderVolumeByPortId[key] }));
    // Sắp xếp danh sách theo thứ tự tăng dần của Optional<number> orderVolume
    // entryList.sort(Comparator.comparing(entry -> entry.getValue().orElse(0)));
    entryList.sort((a, b) => a.value - b.value);
    var countVolume = 0;
    var countSecuritiesFee = 0;
    var countAmount = 0;
    // Lặp qua danh sách đã được sắp xếp
    for (let i = 0; i < entryList.length; i++) {
        // Map.Entry < number, Optional < number >> entry = entryList.get(i);
        var entry = entryList[i];
        var portfolioId = entry.key;
        // Setup lại detailOrderMatch để phân bổ lệnh khớp tương ứng
        // DetailImportOrderMatchDTO newDetailOrderMatch = new DetailImportOrderMatchDTO(detail);
        var newDetailOrderMatch: DetailImportOrderMatchDTO = { ...detail };
        var orderVolume = entry.value || 0;
        // Số lượng khớp của mỗi DMUT = (Số lượng đặt của mỗi DMUT/Tổng số lượng đặt của tất cả DMUT) * Tổng số khớp của DMUT theo file import
        // Phí giao dịch = (Số lượng đặt của mỗi DMUT/Tổng số lượng đặt của tất cả DMUT) * Phí giao dịch theo file import khớp lệnh
        var newVolume = orderVolume * detail.volume / totalOrderVolumeRequest
        // .multiply(detail.getVolume())
        // .divide(totalOrderVolumeRequest, 0, RoundingMode.FLOOR); // lam trong xuong
        var newVolume = floor(orderVolume * detail.volume / totalOrderVolumeRequest)
        // countVolume = countVolume.add(newVolume);
        countVolume += newVolume;

        // number newSecuritiesFee = orderVolume
        // .multiply(detail.getSecuritiesFee())
        // .divide(totalOrderVolumeRequest, 0, RoundingMode.FLOOR);
        var newSecuritiesFee = floor(orderVolume * detail.securitiesFee / totalOrderVolumeRequest)

        // countSecuritiesFee = countSecuritiesFee.add(newSecuritiesFee);
        countSecuritiesFee += newSecuritiesFee

        // number newAmount = newVolume.multiply(detail.getPrice());
        var newAmount = newVolume * detail.price;

        // countAmount = countAmount.add(newAmount);
        // newDetailOrderMatch.setVolume(newVolume);
        // newDetailOrderMatch.setSecuritiesFee(newSecuritiesFee);
        // newDetailOrderMatch.setAmount(newAmount);
        // mapDetailImportByPortId.put(portfolioId, newDetailOrderMatch);
        countAmount += newAmount
        newDetailOrderMatch.volume = newVolume
        newDetailOrderMatch.securitiesFee = newSecuritiesFee
        newDetailOrderMatch.amount = newAmount
        mapDetailImportByPortId[portfolioId] = newDetailOrderMatch
    }
    // Phân bổ phần dư cho các danh mục trong danh sách theo thứ tự từ dưới lên
    // var remainderVolume = totalOrderVolumeRequest.subtract(countVolume).intValue(); // phan du
    var remainderVolume = floor(totalOrderVolumeRequest - countVolume)


    // var lastElement = mapLastElementRound.get(detail.getProductCode());
    var lastElement = mapLastElementRound[detail.productCode]

    while (remainderVolume > 0 && lastElement >= 0) {
        // number portfolioId = entryList.get(lastElement).getKey();
        var portfolioId = entryList[lastElement]?.key
        // var detailOrderMatch = mapDetailImportByPortId.get(portfolioId);
        var detailOrderMatch = mapDetailImportByPortId[portfolioId]


        // Tăng volume lên 1 đơn vị và cập nhật amount
        // detailOrderMatch.setVolume(detailOrderMatch.getVolume().add(number.ONE));
        // detailOrderMatch.setAmount(detailOrderMatch.getVolume().multiply(detailOrderMatch.getPrice()));
        // lastElement--;
        // remainderVolume--;


        detailOrderMatch.volume = detailOrderMatch.volume + 1;
        detailOrderMatch.amount = detailOrderMatch.volume * detailOrderMatch.price;
        lastElement--;
        remainderVolume--;
    }
    // Nếu phần tử cuối < 0, đảo vòng làm tròn
    //    if (lastElement < 0) {
    //      lastElement = entryList.size() - 1;
    //    }
    //   Đặt lại phần tử cuối của danh sách muốn làm tròn
    // mapLastElementRound.put(detail.getProductCode(), lastElement);
    // return mapDetailImportByPortId;


    mapLastElementRound[detail.productCode] = lastElement;
    return mapDetailImportByPortId;
}

export function caculateStart() {
    mySplitOrderMatchToPortfolio(input)
}

/**
 *
 * @param listDataDTO
 */
function mySplitOrderMatchToPortfolio(listDataDTO: ImportOrderMatchDTO[]) {
    var splitedListDataDTO: ImportOrderMatchDTO[] = [];
    listDataDTO.forEach(importOrderMatchDTO => {
        var portfolioIds = importOrderMatchDTO.portfolioIds;
        var detailOrderMatches: DetailImportOrderMatchDTO[] = importOrderMatchDTO.detailOrderMatches;
        /*
        if (CollectionUtils.isEmpty(portfolioIds)) {
          continue;
        }
        if (portfolioIds.size() == 1) {
          importOrderMatchDTO.setPortfolioId(portfolioIds.get(0));
          listOrderMatchDTOs.add(importOrderMatchDTO);
          continue;
        }
        */
        // Trường hơp có nhiều portfolioId => Tiến hành phân bổ lệnh
        // Tạo 1 HashMap lưu Portfolio và List<DetailImportOrderMatchDTO> tương ứng của port đó sau khi đã phân bổ phiếu lệnh ra các port
        // Map<Long, List<DetailImportOrderMatchDTO>> mapListDetailImportByPortId = new HashMap<>();
        var mapListDetailImportByPortId: Record<number, DetailImportOrderMatchDTO[]> = {};
        var accumulationVolumeByPortfolio: Record<number, number> = {};
        var totalDeviation = 0;
        var portfolioFullState: Record<number, number> = {};

        detailOrderMatches.forEach(stepPrice => {
            // var productCode = detail.getProductCode();
            // var portfolioCompoRequests = portfolioCompoRequestRepository.findByPortfolioIdInAndProductCode(

            var productCode = stepPrice.productCode;
            var portfolioCompoRequests: PortfolioCompoRequest[] = portfolioCompoRequestRepository.findByPortfolioIdInAndProductCode(productCode)
            var mapOrderVolumeByPortId = mappingOrderVolumeByPortId(portfolioCompoRequests)
            mapOrderVolumeByPortId.sort(sortASCByOrderVolume)
            var totalOrderVolumeRequest = mapOrderVolumeByPortId.map(r => r.orderVolume).reduce(reduceSum)

            var threshold = mapOrderVolumeByPortId.length - 1
            // var size = mapOrderVolumeByPortId.length
            var reduceThreshold = 0

            var totalAllocationVolume = 0

            console.log('>> Start price:', stepPrice.price, ', total', stepPrice.volume)
            for (let i = 0; i <= threshold; i++) {
                var compoRequest = mapOrderVolumeByPortId[i];
                var allocationRate = compoRequest.orderVolume / totalOrderVolumeRequest;

                // var result = allocate(
                //     compoRequest.portfolioId,
                //     compoRequest.orderVolume,
                //     allocationRate,
                //     stepPrice.volume,
                //     i,
                //     threshold,
                //     size,
                //     reduceThreshold,
                //     totalDeviation,
                //     accumulationVolumeByPortfolio
                // )

                var portfolioId = compoRequest.portfolioId
                var totalAmount = stepPrice.volume
                var maxAllocation = compoRequest.orderVolume


                var floatAmount = totalAmount * allocationRate
                var floorAmount = floor(floatAmount)
                var deviation = floatAmount - floorAmount

                totalDeviation = totalDeviation + deviation

                var curentAccumulation = (accumulationVolumeByPortfolio[portfolioId] ?? 0)
                var availbleAllocation = maxAllocation - curentAccumulation
                var distance = threshold - i - totalDeviation
                var added = (totalDeviation >= 1 && distance <= 1) ? 1 : 0
                var allocatedAmount = Math.min(floorAmount + added, availbleAllocation)
                totalDeviation -= allocatedAmount - floorAmount

                var accumulationVolume = curentAccumulation + allocatedAmount
                accumulationVolumeByPortfolio[portfolioId] = accumulationVolume

                if (accumulationVolume === maxAllocation) {
                    reduceThreshold++
                }
                if (i === threshold) {
                    threshold -= reduceThreshold
                    reduceThreshold = 0
                }

                if (895 === allocatedAmount) {
                    debugger
                }
                totalAllocationVolume += allocatedAmount

                allocateToExistingPortfolio(
                    portfolioId,
                    allocatedAmount,
                    stepPrice,
                    mapListDetailImportByPortId
                )
            }
        })

        var totalAllocatedVolume = Object.values(accumulationVolumeByPortfolio).reduce(reduceSum)
        var totalMatch = detailOrderMatches.map(o => o.volume).reduce(reduceSum)
        var rest = totalMatch - totalAllocatedVolume
        if (rest > 0) {
            var lastStepPrice = detailOrderMatches[detailOrderMatches.length - 1]
        }

        console.log('mapListDetailImportByPortId', mapListDetailImportByPortId)
        var logData = {}
        var logPrice = {}
        Object.keys(mapListDetailImportByPortId).map(id => {
            const dtoList = mapListDetailImportByPortId[id]
            var total = dtoList.map(e => {
                var kP = `match price ${e.price}`
                logPrice[kP] = {
                    result: (logPrice[kP]?.result ?? 0) + e.volume,
                    expected: input[0].detailOrderMatches.find(d => d.price === e.price).volume
                }
                return e.volume
            }).reduce(reduceSum)
            logData[`Port ${id} total volume`] = {
                result: total,
                expected: portfolioCompoRequestRepositoryData.find(p => toString(p.portfolioId) === id).orderVolume
            }
        })
        console.log(logData)
        console.log(logPrice)
        // End
    })
}

function allocateToExistingPortfolio(
    portfolioId,
    allocationVolume,
    DTO,
    mapListDetailImportByPortId: Record<number, DetailImportOrderMatchDTO[]>
) {
    var newDetailOrderMatch = { ...DTO }
    newDetailOrderMatch.volume = allocationVolume
    // Tự tính newAmount
    var lastDetailOrderMatchs = mapListDetailImportByPortId[portfolioId] ?? []

    lastDetailOrderMatchs.push(newDetailOrderMatch)

    mapListDetailImportByPortId[portfolioId] = lastDetailOrderMatchs
}

function mappingOrderVolumeByPortId(portfolioCompoRequests: PortfolioCompoRequest[]): PortfolioCompoRequest[] {
    const hasMap = {}
    portfolioCompoRequests.map(request => {
        const mergeOrderVolume = (hasMap[request.portfolioId] ?? 0) + request.orderVolume
        hasMap[request.portfolioId] = {
            ...request,
            orderVolume: mergeOrderVolume
        }
    })
    return Object.values(hasMap)
}

function sortASCByOrderVolume(a, b) { return a.orderVolume - b.orderVolume }
function reduceSum(a, b) { return a + b }

function allocate(
    portfolioId,
    maxAllocation,
    rate,
    totalAmount,
    index,
    threshold,
    size,
    reduceThreshold,
    totalDeviation,
    accumulationVolumeByPortfolio,
) {
    var floatAmount = totalAmount * rate
    var floorAmount = floor(floatAmount)
    var deviation = floatAmount - floorAmount

    //   var prevBalancing = balanceForPortfolio[portfolioId] ?? 0

    totalDeviation = totalDeviation + deviation // - prevBalancing

    //   var previousLeakVolume = (leakVolumeByPortfolio[portfolioId] ?? 0)
    var curentAccumulation = (accumulationVolumeByPortfolio[portfolioId] ?? 0)
    var availbleAllocation = maxAllocation - curentAccumulation
    var distance = threshold - index - totalDeviation
    var added = (totalDeviation >= 1 && distance <= 1) ? 1 : 0
    var allocatedAmount = Math.min(floorAmount + added, availbleAllocation)
    totalDeviation -= allocatedAmount - floorAmount

    //   var balancing = added * (allocatedAmount - floatAmount)
    //   var newBalancing = (prevBalancing * added) + balancing
    //   balanceForPortfolio[portfolioId] = (prevBalancing * added) + balancing


    //   var updateLeakVolume = previousLeakVolume + (floatAmount - allocatedAmount)
    //   leakVolumeByPortfolio[portfolioId] = updateLeakVolume

    var accumulationVolume = curentAccumulation + allocatedAmount
    accumulationVolumeByPortfolio[portfolioId] = accumulationVolume

    if (accumulationVolume === maxAllocation) {
        reduceThreshold++
    }
    if (index === threshold) {
        threshold -= reduceThreshold
        reduceThreshold = 0
    }

    if (895 === allocatedAmount) {
        debugger
    }

    console.log(portfolioId, '=', floatAmount, '=>', allocatedAmount, deviation, totalDeviation)
    return [
        allocatedAmount,
        totalDeviation,
        accumulationVolumeByPortfolio,
        threshold,
        reduceThreshold
    ]
}
