![](https://img.shields.io/npm/v/@whi/serious-error-types/latest?style=flat-square)

# Serious Error Types
This module brings a hierarchy of well defined error types to help make error handling a proactive
measure rather than a reactive obligation.

![](https://img.shields.io/github/issues-raw/mjbrisebois/serious-error-types?style=flat-square)
![](https://img.shields.io/github/issues-closed-raw/mjbrisebois/serious-error-types?style=flat-square)
![](https://img.shields.io/github/issues-pr-raw/mjbrisebois/serious-error-types?style=flat-square)

## Overview
The ethos behind the hierarchy of types is set of failure mode strategies for creating robust and
deterministic code.

The "Serious" in this module's name implies that these error types are for developers who take their
code seriously; it should not imply that the errors are critical, dangerous, or severe.

Error Hierarchy
```
Error
 |
 |- EvalError
 |- InternalError
 |- RangeError
 |- ReferenceError
 |- SyntaxError
 |- TypeError
 |- URIError
 |
 '- SeriousError
     |
     |- InputError
     |   |- MissingArgumentError
     |   '- InvalidArgumentError
     |
     |- DatabaseError
     |   |- DatabaseQueryError
     |   '- ItemNotFoundError
     |
     |- AuthError
     |   '- AuthenticationError
     |
     '- HTTPError
         '- HTTPResponseError
             '- MethodNotAllowedError
```
