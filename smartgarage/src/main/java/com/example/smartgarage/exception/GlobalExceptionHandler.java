package com.example.smartgarage.exception;

import com.example.smartgarage.dto.ErrorMessage;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // 1. Bắt lỗi Resource Not Found
    @ExceptionHandler(ResourceNotFoundException.class)
    @ResponseStatus(value = HttpStatus.NOT_FOUND)
    public ErrorMessage handleResourceNotFoundException(ResourceNotFoundException ex, WebRequest request) {
        return new ErrorMessage(HttpStatus.NOT_FOUND.value(), LocalDateTime.now(), ex.getMessage(), request.getDescription(false));
    }

    // 2. CẢI TIẾN: Bắt TOÀN BỘ lỗi Validation
    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(value = HttpStatus.BAD_REQUEST)
    public ErrorMessage handleValidationException(MethodArgumentNotValidException ex, WebRequest request) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error ->
                errors.put(error.getField(), error.getDefaultMessage())
        );

        return new ErrorMessage(
                HttpStatus.BAD_REQUEST.value(),
                LocalDateTime.now(),
                "Dữ liệu không hợp lệ: " + errors.toString(), // Hoặc tùy biến hiển thị
                request.getDescription(false)
        );
    }

    // 3. THÊM MỚI: Bắt lỗi sai kiểu dữ liệu trên URL (Ví dụ: /parts/chu_khong_phai_so)
    @ExceptionHandler(org.springframework.web.method.annotation.MethodArgumentTypeMismatchException.class)
    @ResponseStatus(value = HttpStatus.BAD_REQUEST)
    public ErrorMessage handleTypeMismatch(org.springframework.web.method.annotation.MethodArgumentTypeMismatchException ex, WebRequest request) {
        return new ErrorMessage(
                HttpStatus.BAD_REQUEST.value(),
                LocalDateTime.now(),
                String.format("Tham số '%s' phải có kiểu dữ liệu là %s", ex.getName(), ex.getRequiredType().getSimpleName()),
                request.getDescription(false)
        );
    }

    // 4. THÊM MỚI: Bắt lỗi JSON sai cú pháp
    @ExceptionHandler(org.springframework.http.converter.HttpMessageNotReadableException.class)
    @ResponseStatus(value = HttpStatus.BAD_REQUEST)
    public ErrorMessage handleInvalidJson(org.springframework.http.converter.HttpMessageNotReadableException ex, WebRequest request) {
        return new ErrorMessage(
                HttpStatus.BAD_REQUEST.value(),
                LocalDateTime.now(),
                "Cấu trúc JSON không hợp lệ hoặc sai định dạng dữ liệu!",
                request.getDescription(false)
        );
    }

    // 5. Xử lý logic nghiệp vụ và lỗi hệ thống (Giữ nguyên như của bạn)
    @ExceptionHandler(RuntimeException.class)
    @ResponseStatus(value = HttpStatus.BAD_REQUEST)
    public ErrorMessage handleRuntimeException(RuntimeException ex, WebRequest request) {
        return new ErrorMessage(HttpStatus.BAD_REQUEST.value(), LocalDateTime.now(), ex.getMessage(), request.getDescription(false));
    }

    @ExceptionHandler(Exception.class)
    @ResponseStatus(value = HttpStatus.INTERNAL_SERVER_ERROR)
    public ErrorMessage handleGlobalException(Exception ex, WebRequest request) {
        return new ErrorMessage(HttpStatus.INTERNAL_SERVER_ERROR.value(), LocalDateTime.now(), "Lỗi hệ thống!", request.getDescription(false));
    }
}
