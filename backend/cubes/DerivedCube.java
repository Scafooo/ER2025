package main.java.com.cubes;

import java.util.List;



public class DerivedCube {

    private String name;
    private String baseDataCube;
    private List<List<String>> rollup;
    private List<List<String>> drilldown;
    private Object dimensions;
    private List<List<String>> measures;
    private String cubeCode;
    private String sparqlCode;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getBaseDataCube(){
        return baseDataCube;
    }

    public void setBaseDataCube(String baseDataCube) {
        this.baseDataCube = baseDataCube;
    }

    public List<List<String>> getRollup() {
        return rollup;
    }

    public void setRollup(List<List<String>> rollup) {
        this.rollup = rollup;
    }

    public List<List<String>> getDrilldown() {
        return drilldown;
    }

    public void setDrilldown(List<List<String>> drilldown) {
        this.drilldown = drilldown;
    }

    public Object getDimensions() {
        return dimensions;
    }

    public void setDimensions(Object dimensions) {
        this.dimensions = dimensions;
    }

    public List<List<String>> getMeasures() {
        return measures;
    }

    public void setMeasures(List<List<String>> measures) {
        this.measures = measures;
    }

    public String getCubeCode() {
        return cubeCode;
    }

    public void setCubeCode(String cubeCode) {
        this.cubeCode = cubeCode;
    }
    
    public String getSparqlCode() {
        return sparqlCode;
    }

    public void setSparqlCode(String sparqlCode) {
        this.sparqlCode = sparqlCode;
    }


    
}