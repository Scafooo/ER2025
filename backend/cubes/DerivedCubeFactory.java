package main.java.com.cubes;

import java.util.List;



public class DerivedCubeFactory {

    public static void updateDerivedCube(DerivedCube cb) {

        String cubeCode = "Data Cube " + cb.getName() + " on Cube " + cb.getBaseDataCube() + "\n";
        
        List<List<String>> rollup = cb.getRollup();
        List<List<String>> drilldown = cb.getDrilldown();
        List<List<String>> measures = cb.getMeasures();
        

        if(rollup.size()>0){
            cubeCode = cubeCode + "Roll-up on\n";
        }
        
        
        for(int i = 0; i<rollup.size();i++){
            List<String> singleRollup = rollup.get(i);
            if(singleRollup.size()<2){
                cubeCode = cubeCode + "dimension " + singleRollup.get(0)+"\n";
            }
            else{
                cubeCode = cubeCode + "dimension " + singleRollup.get(0) + " at node " + singleRollup.get(1) + " at hierarchy " + singleRollup.get(2) + "\n";
            }
        }

        if(drilldown.size()>0){
            cubeCode = cubeCode + "Drill-down on\n";
        }
        for(int i = 0; i<drilldown.size();i++){
            List<String> singleDrilldown = drilldown.get(i);
            cubeCode = cubeCode + "dimension " + singleDrilldown.get(0) + " at node " + singleDrilldown.get(1) + " at hierarchy " + singleDrilldown.get(2) + "\n";
        }

        cubeCode = cubeCode + "having measures\n";
        for(int i = 0; i<measures.size();i++){
            List<String> singlemeasure = measures.get(i);
            cubeCode = cubeCode + singlemeasure.get(2) + "(" + singlemeasure.get(0) + ") as " + singlemeasure.get(1) + "\n";
        }

        cb.setCubeCode(cubeCode);
    }

}