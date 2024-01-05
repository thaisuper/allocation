/* eslint-disable */
import { isEmpty, isNil, floor, toString } from 'lodash';
import { input, portfolioCompoRequestRepositoryData } from './data';

export interface PortfolioCompoRequest {
    productCode: string,
    portfolioId: number,
    orderVolume: number,
    type: string,
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
}

export interface ImportOrderMatchDTO {
    portfolioIds: number[];
    portfolioId: number,
    detailOrderMatches: DetailImportOrderMatchDTO[];
}

export function caculateStart() {
    splitOrderMatchToPortfolio(input)
}

/**
 *
 * @param listDataDTO
 */
function splitOrderMatchToPortfolio(listDataDTO: ImportOrderMatchDTO[]) {
    var splitedListDataDTO: ImportOrderMatchDTO[] = [];
    listDataDTO.forEach(importOrderMatchDTO => {
        var detailOrderMatches: DetailImportOrderMatchDTO[] = importOrderMatchDTO.detailOrderMatches;
        var mapListDetailImportByPortId: Record<number, DetailImportOrderMatchDTO[]> = {};
        var accumulationVolumeByPortfolio: Record<number, number> = {};
        var totalDeviation = 0;
        var portfolioMissingVolume: Record<number, any> = {};

        detailOrderMatches.forEach(stepPrice => {

            var productCode = stepPrice.productCode;
            var portfolioCompoRequests: PortfolioCompoRequest[] = portfolioCompoRequestRepository.findByPortfolioIdInAndProductCode(productCode)
            var mapOrderVolumeByPortId = mappingOrderVolumeByPortId(portfolioCompoRequests)

            mapOrderVolumeByPortId.sort(sortASCByOrderVolume)
            var totalOrderVolumeRequest = mapOrderVolumeByPortId.map(r => r.orderVolume).reduce(reduceSum)
            var totalMatchedVolumeRequest = detailOrderMatches.map(r => r.volume).reduce(reduceSum)

            if (totalMatchedVolumeRequest < totalOrderVolumeRequest) {
                changeVolumeRequest(totalMatchedVolumeRequest, mapOrderVolumeByPortId, totalOrderVolumeRequest)
                var totalOrderVolumeRequest = mapOrderVolumeByPortId.map(r => r.orderVolume).reduce(reduceSum)
                console.log('changeVolumeRequest', mapOrderVolumeByPortId)
            }

            var threshold = mapOrderVolumeByPortId.length - 1
            var reduceThreshold = 0

            var totalAllocationVolume = 0

            console.log('>> Start price:', stepPrice.price, ', total', stepPrice.volume)
            for (let i = 0; i <= threshold; i++) {
                var compoRequest = mapOrderVolumeByPortId[i];
                var allocationRate = compoRequest.orderVolume / totalOrderVolumeRequest;

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
                    delete portfolioMissingVolume[portfolioId]
                } else {
                    portfolioMissingVolume[portfolioId] = {
                        miss: maxAllocation - accumulationVolume,
                        price: stepPrice.price
                    }
                }
                if (i === threshold) {
                    threshold -= reduceThreshold
                    reduceThreshold = 0
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

        if (Object.keys(portfolioMissingVolume)) {
            allocateMissingVolume(portfolioMissingVolume, mapListDetailImportByPortId)
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

function changeVolumeRequest(
    totalMatchedVolumeRequest: number,
    mapOrderVolumeByPortId: PortfolioCompoRequest[],
    totalOrderVolumeRequest: number
) {
    var restVolume = totalMatchedVolumeRequest
    mapOrderVolumeByPortId.forEach((compoRequest: PortfolioCompoRequest) => {
        var orderVolume = compoRequest.orderVolume
        var rate = (orderVolume / totalOrderVolumeRequest)
        compoRequest.orderVolume = floor(rate * totalMatchedVolumeRequest)
        restVolume -= compoRequest.orderVolume
    })
    if (restVolume > 0) {
        mapOrderVolumeByPortId[mapOrderVolumeByPortId.length - 1].orderVolume += restVolume
    }
}

function allocateMissingVolume(
    portfolioMissingVolume: Record<number, any>,
    mapListDetailImportByPortId: Record<number, DetailImportOrderMatchDTO[]>
) {
    Object.keys(portfolioMissingVolume).map(portfolioId => {
        mapListDetailImportByPortId[portfolioId].forEach((detail: DetailImportOrderMatchDTO) => {
            var added = portfolioMissingVolume[portfolioId].miss
            var price = portfolioMissingVolume[portfolioId].price
            detail.volume += detail.price === price ? added : 0
        })
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
