package main.java.com.cubes;

public class HierarchyEdges {
    private String fromField;
    private String toField;
    private String VE_Name;

    public String getFromField() {
        return fromField;
    }

    public void setFromField(String fromFieldName) {
        this.fromField = fromFieldName;
    }

    public String getToField() {
        return toField;
    }

    public void setToField(String toFieldName) {
        this.toField = toFieldName;
    }

    public String getVE_Name() {
        return VE_Name;
    }

    public void setVE_Name(String inputVE_Name) {
        this.VE_Name = inputVE_Name;
    }
}