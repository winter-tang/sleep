import java.io.*;

public class RunBuild {
    public static void main(String[] args) {
        try {
            ProcessBuilder pb = new ProcessBuilder(
                "/Users/wintert/Documents/trae_projects/android/gradlew", 
                "app:assembleDebug"
            );
            pb.directory(new File("/Users/wintert/Documents/trae_projects/android"));
            pb.redirectErrorStream(true);
            
            Process process = pb.start();
            
            BufferedReader reader = new BufferedReader(
                new InputStreamReader(process.getInputStream())
            );
            
            String line;
            while ((line = reader.readLine()) != null) {
                System.out.println(line);
            }
            
            int exitCode = process.waitFor();
            System.out.println("\nBuild completed with exit code: " + exitCode);
            
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
