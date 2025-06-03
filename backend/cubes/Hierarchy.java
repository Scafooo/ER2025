package main.java.com.cubes;

import java.util.List;

public class Hierarchy {
    private String name;
    private String description;
    private List<String> nodes;
    private List<Object> signature;

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

    public List<String> getNodes() {
        return nodes;
    }

    public void setNodes(List<String> Nodes) {
        this.nodes = Nodes;
    }

    public List<Object> getSignature() {
        return signature;
    }

    public void setSignature(List<Object> signature) {
        this.signature = signature;
    }

    // public static HierarchyEdges getField(Hierarchy hierarchy, String name) {
    //     for (HierarchyEdges field : hierarchy.getSignature())
    //         if (field.getFieldName().equals(name))
    //             return field;
    //     return null;
    // }

}