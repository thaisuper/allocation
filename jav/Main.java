package jav;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.json.JSONObject;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonElement;
import com.google.gson.JsonParser;

class PortfolioCompoRequest {
    private String productCode;
    private int portfolioId;
    private int orderVolume;
    private String type;

    public PortfolioCompoRequest(String productCode, int portfolioId, int orderVolume, String type) {
        this.productCode = productCode;
        this.portfolioId = portfolioId;
        this.orderVolume = orderVolume;
        this.type = type;
    }

    public String getProductCode() {
        return productCode;
    }

    public void setProductCode(String productCode) {
        this.productCode = productCode;
    }

    public int getPortfolioId() {
        return portfolioId;
    }

    public void setPortfolioId(int portfolioId) {
        this.portfolioId = portfolioId;
    }

    public int getOrderVolume() {
        return orderVolume;
    }

    public void setOrderVolume(int orderVolume) {
        this.orderVolume = orderVolume;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }
}

class PortfolioCompoRequestRepository {

    public static List<PortfolioCompoRequest> findByPortfolioIdInAndProductCode(String... args) {
        PortfolioCompoRequest[] arr = new PortfolioCompoRequest[] {
                new PortfolioCompoRequest("AAA", 111, 550, "BUY"),
                new PortfolioCompoRequest("AAA", 222, 450, "BUY"),
                new PortfolioCompoRequest("AAA", 333, 400, "BUY"),
        };
        List<PortfolioCompoRequest> portfolioCompoRequestRepositoryData = Arrays.asList(arr);

        return portfolioCompoRequestRepositoryData;
    }
}

class DetailImportOrderMatchDTO {
    private String orderType;
    private String productCode;
    private int volume;
    private int price;

    public DetailImportOrderMatchDTO(String orderType, String productCode, int volume, int price) {
        this.orderType = orderType;
        this.productCode = productCode;
        this.volume = volume;
        this.price = price;
    }

    public String getOrderType() {
        return orderType;
    }

    public void setOrderType(String orderType) {
        this.orderType = orderType;
    }

    public String getProductCode() {
        return productCode;
    }

    public void setProductCode(String productCode) {
        this.productCode = productCode;
    }

    public int getVolume() {
        return volume;
    }

    public void setVolume(int volume) {
        this.volume = volume;
    }

    public int getPrice() {
        return price;
    }

    public void setPrice(int price) {
        this.price = price;
    }

    public String toString() {
        return String.format("{productCode: %s, price: %d, volume: %d}", this.productCode, this.price, this.volume);
    }
}

class ImportOrderMatchDTO {
    private List<Integer> portfolioIds;
    private int portfolioId;
    private List<DetailImportOrderMatchDTO> detailOrderMatches;

    public ImportOrderMatchDTO(List<Integer> portfolioIds, int portfolioId,
            List<DetailImportOrderMatchDTO> detailOrderMatches) {
        this.portfolioIds = portfolioIds;
        this.portfolioId = portfolioId;
        this.detailOrderMatches = detailOrderMatches;
    }

    public List<Integer> getPortfolioIds() {
        return portfolioIds;
    }

    public void setPortfolioIds(List<Integer> portfolioIds) {
        this.portfolioIds = portfolioIds;
    }

    public int getPortfolioId() {
        return portfolioId;
    }

    public void setPortfolioId(int portfolioId) {
        this.portfolioId = portfolioId;
    }

    public List<DetailImportOrderMatchDTO> getDetailOrderMatches() {
        return detailOrderMatches;
    }

    public void setDetailOrderMatches(List<DetailImportOrderMatchDTO> detailOrderMatches) {
        this.detailOrderMatches = detailOrderMatches;
    }

    public String toString() {
        return "{detailOrderMatches: [" + this.detailOrderMatches + "]}";
    }
}

public class Main {
    static List<PortfolioCompoRequest> portfolioCompoRequestRepositoryData;
    static List<ImportOrderMatchDTO> input;

    public static void main(String[] args) {

        ImportOrderMatchDTO[] arr = new ImportOrderMatchDTO[] {
                new ImportOrderMatchDTO(
                        Arrays.asList(new Integer[] { 111, 222, 333 }),
                        111,
                        Arrays.asList(new DetailImportOrderMatchDTO[] {
                                new DetailImportOrderMatchDTO("BUY", "AAA", 250, 20000),
                                new DetailImportOrderMatchDTO("BUY", "AAA", 400, 21000),
                                new DetailImportOrderMatchDTO("BUY", "AAA", 300, 22000),
                                new DetailImportOrderMatchDTO("BUY", "AAA", 250, 23000),
                                new DetailImportOrderMatchDTO("BUY", "AAA", 200, 24000),
                        }))
        };

        input = Arrays.asList(arr);

        splitOrderMatchToPortfolio(input);
    }

    public static void splitOrderMatchToPortfolio(List<ImportOrderMatchDTO> listDataDTO) {
        for (ImportOrderMatchDTO importOrderMatchDTO : listDataDTO) {
            List<DetailImportOrderMatchDTO> detailOrderMatches = importOrderMatchDTO.getDetailOrderMatches();
            Map<Integer, List<DetailImportOrderMatchDTO>> mapListDetailImportByPortId = new HashMap<>();
            Map<Integer, Integer> accumulationVolumeByPortfolio = new HashMap<>();
            int totalDeviation = 0;
            Map<Integer, Map<String, Integer>> portfolioMissingVolume = new HashMap<>();
            for (DetailImportOrderMatchDTO stepPrice : detailOrderMatches) {
                String productCode = stepPrice.getProductCode();
                List<PortfolioCompoRequest> portfolioCompoRequests = PortfolioCompoRequestRepository
                        .findByPortfolioIdInAndProductCode(productCode);
                portfolioCompoRequestRepositoryData = portfolioCompoRequests;
                List<PortfolioCompoRequest> mapOrderVolumeByPortId = mappingOrderVolumeByPortId(portfolioCompoRequests);
                mapOrderVolumeByPortId.sort((a, b) -> a.getOrderVolume() - b.getOrderVolume());
                int totalOrderVolumeRequest = mapOrderVolumeByPortId.stream()
                        .mapToInt(PortfolioCompoRequest::getOrderVolume).sum();
                int totalMatchedVolumeRequest = detailOrderMatches.stream()
                        .mapToInt(DetailImportOrderMatchDTO::getVolume).sum();
                if (totalMatchedVolumeRequest < totalOrderVolumeRequest) {
                    changeVolumeRequest(totalMatchedVolumeRequest, mapOrderVolumeByPortId, totalOrderVolumeRequest);
                    totalOrderVolumeRequest = mapOrderVolumeByPortId.stream()
                            .mapToInt(PortfolioCompoRequest::getOrderVolume).sum();
                    System.out.println("changeVolumeRequest " + mapOrderVolumeByPortId);
                }
                int threshold = mapOrderVolumeByPortId.size() - 1;
                int reduceThreshold = 0;
                int totalAllocationVolume = 0;
                System.out.println(">> Start price: " + stepPrice.getPrice() + ", total " + stepPrice.getVolume());
                for (int i = 0; i <= threshold; i++) {
                    PortfolioCompoRequest compoRequest = mapOrderVolumeByPortId.get(i);
                    double allocationRate = (double) compoRequest.getOrderVolume() / totalOrderVolumeRequest;
                    int portfolioId = compoRequest.getPortfolioId();
                    int totalAmount = stepPrice.getVolume();
                    int maxAllocation = compoRequest.getOrderVolume();
                    double floatAmount = totalAmount * allocationRate;
                    int floorAmount = (int) Math.floor(floatAmount);
                    double deviation = floatAmount - floorAmount;
                    totalDeviation += deviation;
                    int curentAccumulation = accumulationVolumeByPortfolio.getOrDefault(portfolioId, 0);
                    int availbleAllocation = maxAllocation - curentAccumulation;
                    int distance = threshold - i - totalDeviation;
                    int added = (totalDeviation >= 1 && distance <= 1) ? 1 : 0;
                    int allocatedAmount = Math.min(floorAmount + added, availbleAllocation);
                    totalDeviation -= allocatedAmount - floorAmount;
                    int accumulationVolume = curentAccumulation + allocatedAmount;
                    accumulationVolumeByPortfolio.put(portfolioId, accumulationVolume);
                    if (accumulationVolume == maxAllocation) {
                        reduceThreshold++;
                        portfolioMissingVolume.remove(portfolioId);
                    } else {
                        portfolioMissingVolume.put(portfolioId,
                                Map.of("miss", maxAllocation - accumulationVolume, "price", stepPrice.getPrice()));
                    }
                    if (i == threshold) {
                        threshold -= reduceThreshold;
                        reduceThreshold = 0;
                    }
                    totalAllocationVolume += allocatedAmount;
                    allocateToExistingPortfolio(portfolioId, allocatedAmount, stepPrice, mapListDetailImportByPortId);
                }
            }
            if (!portfolioMissingVolume.isEmpty()) {
                allocateMissingVolume(portfolioMissingVolume, mapListDetailImportByPortId);
            }

            Map<String, Map<String, Integer>> logData = new HashMap<>();
            Map<String, Map<String, Integer>> logPrice = new HashMap<>();
            for (Integer id : mapListDetailImportByPortId.keySet()) {
                List<DetailImportOrderMatchDTO> dtoList = mapListDetailImportByPortId.get(id);
                int total = dtoList.stream().mapToInt(DetailImportOrderMatchDTO::getVolume).sum();
                logData.put("Port " + id + " total volume",
                        Map.of("-result-", total, "expected",
                                portfolioCompoRequestRepositoryData.stream()
                                        .filter(p -> Integer.toString(p.getPortfolioId()).equals(Integer.toString(id)))
                                        .findFirst().get().getOrderVolume()));
                for (DetailImportOrderMatchDTO e : dtoList) {
                    String kP = "match price " + e.getPrice();
                    logPrice.put(kP,
                            Map.of("-result-", logPrice.getOrDefault(kP,

                                    Map.of("-result-", 0)).get("-result-") + e.getVolume(),

                                    "expected",
                                    input.get(0).getDetailOrderMatches().stream()
                                            .filter(d -> d.getPrice() == e.getPrice()).findFirst().get().getVolume()));
                }
            }
            String println = String.format("[%s,%s,%s]",
                    new JSONObject(mapListDetailImportByPortId).toString(),
                    new JSONObject(logData).toString(),
                    new JSONObject(logPrice).toString());
            // System.out.println(println);

            Gson gson = new GsonBuilder().setPrettyPrinting().create();
            JsonElement jsonElement = JsonParser.parseString(println);
            String prettyJson = gson.toJson(jsonElement);
            System.out.println(prettyJson);
        }

    }

    public static void changeVolumeRequest(int totalMatchedVolumeRequest,
            List<PortfolioCompoRequest> mapOrderVolumeByPortId, int totalOrderVolumeRequest) {
        int restVolume = totalMatchedVolumeRequest;
        for (PortfolioCompoRequest compoRequest : mapOrderVolumeByPortId) {
            int orderVolume = compoRequest.getOrderVolume();
            double rate = (double) orderVolume / totalOrderVolumeRequest;
            compoRequest.setOrderVolume((int) Math.floor(rate * totalMatchedVolumeRequest));
            restVolume -= compoRequest.getOrderVolume();
        }
        if (restVolume > 0) {
            mapOrderVolumeByPortId.get(mapOrderVolumeByPortId.size() - 1).setOrderVolume(
                    mapOrderVolumeByPortId.get(mapOrderVolumeByPortId.size() - 1).getOrderVolume() + restVolume);
        }
    }

    public static void allocateMissingVolume(Map<Integer, Map<String, Integer>> portfolioMissingVolume,
            Map<Integer, List<DetailImportOrderMatchDTO>> mapListDetailImportByPortId) {
        for (Integer portfolioId : portfolioMissingVolume.keySet()) {
            for (DetailImportOrderMatchDTO detail : mapListDetailImportByPortId.get(portfolioId)) {
                int added = portfolioMissingVolume.get(portfolioId).get("miss");
                int price = portfolioMissingVolume.get(portfolioId).get("price");
                detail.setVolume(detail.getPrice() == price ? detail.getVolume() + added : detail.getVolume());
            }
        }
    }

    public static void allocateToExistingPortfolio(int portfolioId, int allocationVolume, DetailImportOrderMatchDTO DTO,
            Map<Integer, List<DetailImportOrderMatchDTO>> mapListDetailImportByPortId) {
        DetailImportOrderMatchDTO newDetailOrderMatch = new DetailImportOrderMatchDTO(DTO.getOrderType(),
                DTO.getProductCode(), allocationVolume, DTO.getPrice());
        List<DetailImportOrderMatchDTO> lastDetailOrderMatchs = mapListDetailImportByPortId.getOrDefault(portfolioId,
                new ArrayList<>());
        lastDetailOrderMatchs.add(newDetailOrderMatch);
        mapListDetailImportByPortId.put(portfolioId, lastDetailOrderMatchs);
    }

    public static List<PortfolioCompoRequest> mappingOrderVolumeByPortId(
            List<PortfolioCompoRequest> portfolioCompoRequests) {
        Map<Integer, PortfolioCompoRequest> hasMap = new HashMap<>();
        for (PortfolioCompoRequest request : portfolioCompoRequests) {
            int mergeOrderVolume = hasMap.getOrDefault(
                    request.getPortfolioId(),
                    new PortfolioCompoRequest("", 0, 0, "")).getOrderVolume() + request.getOrderVolume();
            hasMap.put(request.getPortfolioId(), new PortfolioCompoRequest(request.getProductCode(),
                    request.getPortfolioId(), mergeOrderVolume, request.getType()));
        }
        return new ArrayList<>(hasMap.values());
    }
}