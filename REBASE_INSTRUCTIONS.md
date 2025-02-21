# Instrucciones para finalizar el rebase

1. Si no hay cambios pendientes y deseas continuar el rebase, ejecuta:
   ```
   git rebase --continue
   ```

2. Si necesitas modificar el commit actual, usa:
   ```
   git commit --amend
   ```
   Luego continúa con:
   ```
   git rebase --continue
   ```

3. Cuando el rebase concluya, realiza push (si es necesario, usa push forzado):
   ```
   git push --force-with-lease
   ```
   
Verifica el estado con:
   ```
   git status
   ```
para asegurarte de que el working tree está limpio.
