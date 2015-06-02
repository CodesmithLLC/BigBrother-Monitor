#### Snitcher

1) Snitcher should throw an error if the cwd is not a git repository

2) Snitcher should not start when constructed
  -Does snitcher listen to file deletes?
  -Does snitcher listen to file changes?
  -Does snitcher listen to file additions?
  -Does snitcher listen for commits?

3) Snitcher Should start without a problem if the constructor was ok;

4) When a file is added, Snitcher should emit the fsdiff
  -Does the diff have a subject?
  -Does the diff have a path?
    -Is the path correct?
  -Does the diff have "fs-add" as the diff
  -Does the diff have a test
    -does it correctly say if it fails?
    -does it correctly say when it succeeds?

5) When a file is removed, Snitcher should emit the fsdiff
  -Does the diff have a subject?
    -is the subject the same as the other diff?
  -Does the diff have a path?
    -Is the path correct?
  -Does the diff have "fs-rem" as the diff
  -Does the diff have a test
    -does it correctly say if it fails?
    -does it correctly say when it succeeds?

6) When a file is changed, Snitcher should emit the fsdiff
  -Does the diff have a subject?
    -is the subject the same as the other diffs?
  -Does the diff have a path?
    -Is the path correct?
  -Does the diff have contain the appropriate changes?
    -Is it parseable by parse-diff?
  -Does the diff have a test
    -does it correctly say if it fails?
    -does it correctly say when it succeeds?

7) When a commit is made, Snitcher should emit the commit
  -Does the commit have a subject?
    -is the subject the same as the other diffs?
  -Does the commit have the change list?
    -is it parsable by parse-diff?
    -is the diff the same as all the other changes?
  -Does the diff have a test
    -does it correctly say if it fails?
    -does it correctly say when it succeeds?
