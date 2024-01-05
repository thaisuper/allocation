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
                price: 20000,
                productCode: 'AAA',
                orderType: 'BUY',
                volume: 250,
            },
            {
                price: 21000,
                productCode: 'AAA',
                orderType: 'BUY',
                volume: 400,
            },
            {
                price: 22000,
                productCode: 'AAA',
                orderType: 'BUY',
                volume: 300,
            },
            {
                price: 23000,
                productCode: 'AAA',
                orderType: 'BUY',
                volume: 250,
            },
            {
                price: 24000,
                productCode: 'AAA',
                orderType: 'BUY',
                volume: 200,
            }
        ]
    }
]

/**
 * Đăt lệnh
 */
export const portfolioCompoRequestRepositoryData: PortfolioCompoRequest[] = [
    {
        orderVolume: 550,
        portfolioId: 111,
        productCode: 'AAA',
        type: 'BUY',
    },
    {
        orderVolume: 450,
        portfolioId: 222,
        productCode: 'AAA',
        type: 'BUY',
    },
    {
        orderVolume: 400,
        portfolioId: 333,
        productCode: 'AAA',
        type: 'BUY',
    }
]