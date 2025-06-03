package main.java.com.cubes;

import java.util.ArrayList;
import java.util.List;
import org.json.JSONObject;
import java.util.Iterator;
import java.util.Arrays;


public class CubeFactory {
    
    public static void updateCube(Cube cb) {

        String ValuesDimensions = "";
        String ValuesMeasures = "";
        List<String> dimensionKeys = new ArrayList<>();
        List<List<String>> valDim = cb.getValuesDimensions();
        List<List<String>> valMeas = cb.getValuesMeasures();

        for (int i = 0; i<valDim.size();i++){
            List<String> singleDim = valDim.get(i);
            if (singleDim.size() == 6 && singleDim.get(2) != ""){
                ValuesDimensions = ValuesDimensions + singleDim.get(1) + " from " +  singleDim.get(0) + " with hierarchy " + singleDim.get(2) +"\n";
            }
            else{
                ValuesDimensions = ValuesDimensions + singleDim.get(1) + " from " +  singleDim.get(0)+"\n";
            }
            if(singleDim.get(4)=="true"){
                dimensionKeys.add(singleDim.get(1));
            }
        }

        for (int i = 0; i<valMeas.size();i++){
            List<String> singleMeas = valMeas.get(i);
            ValuesMeasures = ValuesMeasures + singleMeas.get(2) + "(" + singleMeas.get(1) + ") as " + singleMeas.get(0)+"\n";
        }
        String countStar = cb.getCountStar();
        if (countStar != ""){
            ValuesMeasures = ValuesMeasures + " COUNT(*) as ?" + countStar + "\n";
        }
        

        String cubeCode = "Base Data Cube "+ cb.getName() + " on View " + cb.getVirtualEntity()+"\n";
        cubeCode = cubeCode + "with dimensions\n";
        cubeCode = cubeCode + ValuesDimensions ;
        cubeCode = cubeCode + "with measure\n";
        cubeCode = cubeCode + ValuesMeasures;
        cubeCode = cubeCode + "Having keys [" +String.join(", ", dimensionKeys) + "]";

        

        cb.setCubeCode(cubeCode);

        String sparqlCode = cb.getSparqlCode();

        List<String> dimensions_VE = new ArrayList<>(); // Initialize the lists
        List<String> measures_VE = new ArrayList<>();
        List<String> grouping_Attr = new ArrayList<>();
        List<String> rows = new ArrayList<>(); // Initialize the rows list

        for (int i = 0; i < valDim.size(); i++) {
            List<String> dimension = valDim.get(i); // Use get() method to access elements
            dimensions_VE.add("(?" + dimension.get(0) + " as ?" + dimension.get(1) + ")");
            grouping_Attr.add("?" + dimension.get(0));
        }
        String dimensionsVE = String.join(" ", dimensions_VE);
        String groupingAttrVE = "GROUP BY " + String.join(" ", grouping_Attr);

        for (int i = 0; i < valMeas.size(); i++) {
            List<String> measure = valMeas.get(i); // Use get() method to access elements
            measures_VE.add("(" + measure.get(2) + "(?" + measure.get(1) + ") as ?" + measure.get(0) + ")");
        }
        String measuresVE = String.join(" ", measures_VE);

        String selectedAttributes = dimensionsVE + " " + measuresVE;

        if (countStar != ""){
            selectedAttributes = selectedAttributes + " (COUNT(*) as ?" + countStar + ")";
        }

        List<String> sparqlCode_rows = Arrays.asList(sparqlCode.split("\n")); // Use Arrays.asList to convert to list

        for (int i = 0; i < sparqlCode_rows.size(); i++) {
            String actualRow = sparqlCode_rows.get(i); // Use get() method to access elements
            if (actualRow.startsWith("SELECT")) {
                String rowParam = "";
                List<String> parameters = new ArrayList<>(Arrays.asList(actualRow.split(" "))); // Create a new ArrayList
                parameters.removeIf(String::isEmpty); // Remove empty elements
                if (!parameters.isEmpty() && parameters.get(0).equals("SELECT") && parameters.size() > 1 && parameters.get(1).equals("DISTINCT")) {
                    rowParam = "SELECT DISTINCT " + selectedAttributes;
                } else {
                    rowParam = "SELECT " + selectedAttributes;
                }
                rows.add(rowParam);
            } else {
                rows.add(actualRow);
            }
        }

        rows.add(groupingAttrVE);
        String joinedRows = String.join("\n", rows);

        cb.setSparqlCode(joinedRows);
        

    }
}
