package main.java.com.cubes;

import java.util.List;



public class Cube {
    private String name;
    private String description;
    private String virtualEntity;
    private String cubeCode;
    private String sparqlCode;
    private Object dimensions;
    private Object measures;
    private String countStar;
    
    private List<List<String>> valuesDimensions;
    private List<List<String>> valuesMeasures;




    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getVirtualEntity() {
        return virtualEntity;
    }

    public void setVirtualEntity(String virtualEntity) {
        this.virtualEntity = virtualEntity;
    }

    public Object getDimensions() {
        return dimensions;
    }

    public void setDimensions(Object dimensions) {
        this.dimensions = dimensions;
    }

    public Object getMeasures() {
        return measures;
    }

    public void setMeasures(Object measures) {
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

    public List<List<String>> getValuesDimensions() {
        return valuesDimensions;
    }

    public void setValuesDimensions(List<List<String>> valuesDimensions) {
        this.valuesDimensions = valuesDimensions;
    }

    public List<List<String>> getValuesMeasures() {
        return valuesMeasures;
    }

    public void setValuesMeasures(List<List<String>> valuesMeasures) {
        this.valuesMeasures = valuesMeasures;
    }

    public String getCountStar() {
        return countStar;
    }

    public void setCountStar(String countStar) {
        this.countStar = countStar;
    }

   
}