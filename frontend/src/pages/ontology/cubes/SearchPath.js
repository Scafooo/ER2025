class SearchPath {

    searchPath(hierarchy, startNode, endNode) {
        const visited = new Set(); // To keep track of visited nodes
        const path = []; // To store the traversed edges
    
        // Helper function for DFS
        function dfs(currentNode) {
            if (currentNode === endNode) {
                return true; // Found the destination node
            }
    
            visited.add(currentNode);
    
            for (const edge of hierarchy) {
                if (edge.input1 === currentNode && !visited.has(edge.input2)) {
                    path.push([edge.select,'ru']);
                    if (dfs(edge.input2)) {
                        return true;
                    }
                    path.pop(); // Backtrack if the destination is not found
                } else if (edge.input2 === currentNode && !visited.has(edge.input1)) {
                    path.push([edge.select,'dd']);
                    if (dfs(edge.input1)) {
                        return true;
                    }
                    path.pop(); // Backtrack if the destination is not found
                }
            }
    
            return false;
        }
    
        // Start DFS from the startNode
        dfs.call(this, startNode);
        return path;
    }
}

export default SearchPath; // Export the PathFinder class
