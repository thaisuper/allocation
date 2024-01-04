import { ImportOrderMatchDTO, PortfolioCompoRequest } from "./logic"

// Total = 8200
/**
 * Kết quả khớp
 */
export const input: ImportOrderMatchDTO[] = [
    {
        portfolioId: 111,
        portfolioIds: [111, 222, 333],
        detailOrderMatches: [
            {
                price: 15000,
                productCode: 'AAA',
                securitiesFee: 0,
                orderType: 'BUY',
                volume: 3000,
            },
            {
                price: 16500,
                productCode: 'AAA',
                securitiesFee: 0,
                orderType: 'BUY',
                volume: 3100,
            },
            {
                price: 17200,
                productCode: 'AAA',
                securitiesFee: 0,
                orderType: 'BUY',
                volume: 2000,
            }
        ]
    }
]

/**
 * Đăt lệnh
 */
export const portfolioCompoRequestRepositoryData: PortfolioCompoRequest[] = [
    {
        orderVolume: 2200,
        portfolioId: 111,
        productCode: 'AAA',
        type: 'BUY',
    },
    {
        orderVolume: 2500,
        portfolioId: 222,
        productCode: 'AAA',
        type: 'BUY',
    },
    {
        orderVolume: 3500,
        portfolioId: 333,
        productCode: 'AAA',
        type: 'BUY',
    }
]